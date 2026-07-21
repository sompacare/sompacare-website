import { createClerkClient } from "@clerk/backend";
import { Injectable, Logger, Inject, forwardRef, ForbiddenException, NotFoundException } from "@nestjs/common";

import { ConfigService } from "@nestjs/config";

import {
  ADMIN_ROLES,
  FACILITY_ROLES,
  PlatformRole,
  WORKER_ROLES,
  isSompacareCompanyEmail,
} from "@sompacare/shared";

import { UserStatus } from "@sompacare/database";

import { PrismaService } from "../../common/prisma/prisma.module";

import { AuthenticatedUser } from "../../common/decorators";

import { AuditService } from "../../common/audit/audit.service";
import { TenantService } from "../../common/tenant/tenant.service";
import { CareersFunnelService } from "../careers/careers-funnel.service";
import { FacilityOnboardingService } from "../facility-onboarding/facility-onboarding.service";



type ClerkWebhookEvent = {

  type: string;

  data: {

    id: string;

    email_addresses?: Array<{ email_address: string }>;

    first_name?: string | null;

    last_name?: string | null;

    image_url?: string | null;

    phone_numbers?: Array<{ phone_number: string }>;

  };

};



@Injectable()

export class AuthService {

  private readonly logger = new Logger(AuthService.name);



  constructor(

    private prisma: PrismaService,

    private config: ConfigService,

    private audit: AuditService,

    @Inject(forwardRef(() => CareersFunnelService))
    private careerFunnel: CareersFunnelService,

    @Inject(forwardRef(() => FacilityOnboardingService))
    private facilityOnboarding: FacilityOnboardingService,

    private tenant: TenantService

  ) {}

  /** Trust company / invited users — skip Clerk email verification gates at sign-in. */
  private async markClerkEmailsVerified(clerkUserId: string): Promise<void> {
    const secretKey = this.config.get<string>("CLERK_SECRET_KEY");
    if (!secretKey?.trim()) return;

    try {
      const clerk = createClerkClient({ secretKey });
      const clerkUser = await clerk.users.getUser(clerkUserId);

      for (const email of clerkUser.emailAddresses) {
        if (email.verification?.status === "verified") continue;
        await clerk.emailAddresses.updateEmailAddress(email.id, { verified: true });
      }
    } catch (error) {
      this.logger.warn(
        `Clerk email auto-verify failed for ${clerkUserId}: ${(error as Error).message}`
      );
    }
  }


  async validateToken(token: string): Promise<AuthenticatedUser | null> {

    if (token.startsWith("dev_")) {

      if (this.config.get("AUTH_ALLOW_DEV_TOKENS", "true") !== "true") {

        return null;

      }

      return this.validateDevToken(token);

    }



    return this.validateClerkToken(token);

  }



  private clerkAuthorizedParties(): string[] {
    const raw = this.config.get<string>("CORS_ORIGINS") ?? "";
    return raw
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  private async validateClerkToken(token: string): Promise<AuthenticatedUser | null> {

    const secretKey = this.config.get<string>("CLERK_SECRET_KEY");

    if (!secretKey) {

      this.logger.warn("CLERK_SECRET_KEY not configured — Clerk tokens rejected");

      return null;

    }



    try {

      const { verifyToken } = await import("@clerk/backend");

      const jwtKey = this.config.get<string>("CLERK_JWT_KEY")?.trim();
      const authorizedParties = this.clerkAuthorizedParties();
      const payload = await verifyToken(token, {
        ...(jwtKey ? { jwtKey } : { secretKey }),
        ...(authorizedParties.length ? { authorizedParties } : {}),
      });



      const clerkId = payload.sub;

      if (!clerkId) return null;



      let user = await this.prisma.user.findUnique({

        where: { clerkId },

        include: { roles: { include: { role: true } } },

      });



      if (!user) {

        user = await this.provisionUserFromClerkClaims(clerkId, payload);

      }



      if (!user || user.status !== UserStatus.ACTIVE) return null;



      await this.prisma.user.update({

        where: { id: user.id },

        data: { lastLoginAt: new Date() },

      });



      return this.attachTenant(this.toAuthenticatedUser(user));

    } catch (error) {

      this.logger.warn(`Clerk token verification failed: ${(error as Error).message}`);

      return null;

    }

  }



  private async provisionUserFromClerkClaims(
    clerkId: string,
    payload: Record<string, unknown>
  ) {
    const secretKey = this.config.get<string>("CLERK_SECRET_KEY");
    if (!secretKey) return null;

    let email =
      (payload.email as string | undefined) ??
      (payload.primary_email_address as string | undefined);
    let firstName = (payload.first_name as string) ?? "New";
    let lastName = (payload.last_name as string) ?? "User";
    let avatarUrl = (payload.image_url as string) ?? undefined;

    // Clerk session JWTs usually omit email — fetch the user profile from Clerk API.
    if (!email) {
      try {
        const clerk = createClerkClient({ secretKey });
        const clerkUser = await clerk.users.getUser(clerkId);
        email =
          clerkUser.emailAddresses.find(
            (entry) => entry.id === clerkUser.primaryEmailAddressId
          )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;
        firstName = clerkUser.firstName ?? firstName;
        lastName = clerkUser.lastName ?? lastName;
        avatarUrl = clerkUser.imageUrl ?? avatarUrl;
      } catch (error) {
        this.logger.warn(
          `Clerk user fetch failed for ${clerkId}: ${(error as Error).message}`
        );
        return null;
      }
    }

    if (!email) return null;

    const created = await this.prisma.user.create({
      data: {
        clerkId,
        email,
        firstName,
        lastName,
        avatarUrl,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
      include: { roles: { include: { role: true } } },
    });

    await this.audit.log({
      userId: created.id,
      action: "user.provisioned_from_clerk",
      entityType: "User",
      entityId: created.id,
    });

    void this.careerFunnel.linkWorkerFromClerkSignup(email, created.id);
    void this.facilityOnboarding.linkPendingInviteFromSignup(email, created.id);

    return created;
  }



  private async validateDevToken(token: string): Promise<AuthenticatedUser | null> {

    const clerkId = token.replace("dev_", "");

    const user = await this.prisma.user.findUnique({

      where: { clerkId },

      include: { roles: { include: { role: true } } },

    });



    if (!user || user.status !== UserStatus.ACTIVE) return null;



    return this.attachTenant(this.toAuthenticatedUser(user));
  }



  private async attachTenant(user: Omit<AuthenticatedUser, "tenant">): Promise<AuthenticatedUser> {
    const tenant = await this.tenant.resolveForUser(user);
    return { ...user, tenant };
  }



  private toAuthenticatedUser(user: {

    id: string;

    clerkId: string;

    email: string;

    firstName: string;

    lastName: string;

    roles: Array<{ role: { name: string } }>;

  }): Omit<AuthenticatedUser, "tenant"> {

    return {

      id: user.id,

      clerkId: user.clerkId,

      email: user.email,

      firstName: user.firstName,

      lastName: user.lastName,

      roles: user.roles.map((r) => r.role.name as PlatformRole),

    };

  }



  async getMe(userId: string) {

    return this.prisma.user.findUnique({

      where: { id: userId },

      include: {

        roles: { include: { role: true } },

        profile: true,

        organizationMembers: { include: { organization: true } },

      },

    });

  }

  async bootstrapWorkerAccess(userId: string, email: string, employeeNumber?: string) {
    const result = await this.careerFunnel.ensureWorkerAccess(userId, email, employeeNumber);
    return { data: result };
  }

  async verifyEmployee(email: string, employeeNumber: string) {
    const result = await this.careerFunnel.verifyEmployeeAccess(email, employeeNumber);
    return { data: result };
  }

  async bootstrapRecruiterAccess(userId: string, email: string) {
    if (!isSompacareCompanyEmail(email)) {
      throw new ForbiddenException(
        "Recruiter access requires a @sompacare.com company email."
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.markClerkEmailsVerified(user.clerkId);

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException(
        "Your Sompacare access has been terminated. Contact support if you believe this is an error."
      );
    }

    const roleNames = user.roles.map((entry) => entry.role.name as PlatformRole);

    if (roleNames.some((role) => WORKER_ROLES.includes(role))) {
      throw new ForbiddenException(
        "This account is set up as a worker. Sign in through the nurse portal instead."
      );
    }

    if (roleNames.some((role) => FACILITY_ROLES.includes(role))) {
      throw new ForbiddenException(
        "This account is set up for a facility. Use the facility portal instead."
      );
    }

    const existingStaff = roleNames.find(
      (role) => ADMIN_ROLES.includes(role) || role === PlatformRole.RECRUITER
    );
    if (existingStaff) {
      return { data: { ready: true, role: existingStaff, provisioned: false } };
    }

    const recruiterRole = await this.prisma.role.upsert({
      where: { name: PlatformRole.RECRUITER },
      update: {},
      create: {
        name: PlatformRole.RECRUITER,
        displayName: "Recruiter",
        description: "RECRUITER platform role",
      },
    });

    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: recruiterRole.id } },
      update: {},
      create: { userId, roleId: recruiterRole.id },
    });

    await this.audit.log({
      userId,
      action: "recruiter.access_provisioned",
      entityType: "User",
      entityId: userId,
      changes: { email, role: PlatformRole.RECRUITER },
    });

    return { data: { ready: true, role: PlatformRole.RECRUITER, provisioned: true } };
  }



  async handleClerkWebhook(event: ClerkWebhookEvent) {

    const { type, data } = event;



    switch (type) {

      case "user.created":

      case "user.updated":

        return this.syncClerkUser(data);

      case "user.deleted":

        return this.deactivateClerkUser(data.id);

      default:

        return { received: true, handled: false };

    }

  }



  private async syncClerkUser(data: ClerkWebhookEvent["data"]) {

    await this.markClerkEmailsVerified(data.id);

    const email = data.email_addresses?.[0]?.email_address;

    if (!email) {

      return { synced: false, reason: "missing_email" };

    }



    const user = await this.prisma.user.upsert({

      where: { clerkId: data.id },

      update: {

        email,

        firstName: data.first_name ?? "User",

        lastName: data.last_name ?? "",

        avatarUrl: data.image_url ?? undefined,

        phone: data.phone_numbers?.[0]?.phone_number,

        emailVerified: true,

      },

      create: {

        clerkId: data.id,

        email,

        firstName: data.first_name ?? "User",

        lastName: data.last_name ?? "",

        avatarUrl: data.image_url ?? undefined,

        phone: data.phone_numbers?.[0]?.phone_number,

        status: UserStatus.ACTIVE,

        emailVerified: true,

      },

    });



    if (user.status !== UserStatus.ACTIVE) {

      return { synced: false, reason: "user_terminated", userId: user.id };

    }



    await this.audit.log({

      userId: user.id,

      action: "user.synced_from_clerk_webhook",

      entityType: "User",

      entityId: user.id,

    });



    void this.careerFunnel.linkWorkerFromClerkSignup(email, user.id);

    void this.facilityOnboarding.linkPendingInviteFromSignup(email, user.id);

    return { synced: true, userId: user.id };

  }



  private async deactivateClerkUser(clerkId: string) {

    const user = await this.prisma.user.findUnique({ where: { clerkId } });

    if (!user) return { deactivated: false };



    await this.prisma.user.update({

      where: { id: user.id },

      data: {

        status: UserStatus.INACTIVE,

        deletedAt: new Date(),

      },

    });



    await this.audit.log({

      userId: user.id,

      action: "user.deactivated_from_clerk_webhook",

      entityType: "User",

      entityId: user.id,

    });



    return { deactivated: true, userId: user.id };

  }

}


