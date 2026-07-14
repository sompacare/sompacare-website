import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";

import { ConfigService } from "@nestjs/config";

import { PlatformRole } from "@sompacare/shared";

import { UserStatus } from "@sompacare/database";

import { PrismaService } from "../../common/prisma/prisma.module";

import { AuthenticatedUser } from "../../common/decorators";

import { AuditService } from "../../common/audit/audit.service";
import { TenantService } from "../../common/tenant/tenant.service";
import { CareersFunnelService } from "../careers/careers-funnel.service";



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

    private tenant: TenantService

  ) {}



  async validateToken(token: string): Promise<AuthenticatedUser | null> {

    if (token.startsWith("dev_")) {

      if (this.config.get("AUTH_ALLOW_DEV_TOKENS", "true") !== "true") {

        return null;

      }

      return this.validateDevToken(token);

    }



    return this.validateClerkToken(token);

  }



  private async validateClerkToken(token: string): Promise<AuthenticatedUser | null> {

    const secretKey = this.config.get<string>("CLERK_SECRET_KEY");

    if (!secretKey) {

      this.logger.warn("CLERK_SECRET_KEY not configured — Clerk tokens rejected");

      return null;

    }



    try {

      const { verifyToken } = await import("@clerk/backend");

      const payload = await verifyToken(token, { secretKey });



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

      this.logger.debug(`Clerk token verification failed: ${(error as Error).message}`);

      return null;

    }

  }



  private async provisionUserFromClerkClaims(

    clerkId: string,

    payload: Record<string, unknown>

  ) {

    const email =

      (payload.email as string | undefined) ??

      (payload.primary_email_address as string | undefined);



    if (!email) return null;



    const created = await this.prisma.user.create({

      data: {

        clerkId,

        email,

        firstName: (payload.first_name as string) ?? "New",

        lastName: (payload.last_name as string) ?? "User",

        avatarUrl: (payload.image_url as string) ?? undefined,

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



    await this.audit.log({

      userId: user.id,

      action: "user.synced_from_clerk_webhook",

      entityType: "User",

      entityId: user.id,

    });



    void this.careerFunnel.linkWorkerFromClerkSignup(email, user.id);



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


