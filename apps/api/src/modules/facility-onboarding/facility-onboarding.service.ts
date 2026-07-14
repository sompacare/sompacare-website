import { createClerkClient } from "@clerk/backend";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FacilityInviteStatus, PlatformRole as DbPlatformRole } from "@sompacare/database";
import { ADMIN_ROLES, PlatformRole } from "@sompacare/shared";
import { AuditService } from "../../common/audit/audit.service";
import { GeocodingService } from "../../common/geocoding/geocoding.service";
import { PrismaService } from "../../common/prisma/prisma.module";
import { NotificationsService } from "../notifications/notifications.service";
import type {
  AdminInviteFacilityManagerDto,
  FacilityLocationInputDto,
  GeocodeAddressDto,
  SelfServiceFacilityOnboardingDto,
} from "./dto/facility-onboarding.dto";

const INVITE_TTL_DAYS = 14;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  const root = slugify(base) || "facility";
  let candidate = root;
  let n = 2;
  while (await exists(candidate)) {
    candidate = `${root}-${n}`;
    n += 1;
  }
  return candidate;
}

type TenantSetupInput = {
  organizationName: string;
  facilityName: string;
  facilityType: string;
  facilityEmail?: string;
  facilityPhone?: string;
  location: FacilityLocationInputDto;
};

@Injectable()
export class FacilityOnboardingService {
  private readonly logger = new Logger(FacilityOnboardingService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private audit: AuditService,
    private notifications: NotificationsService,
    private geocoding: GeocodingService
  ) {}

  async getStatus(userId: string, email: string, roles: PlatformRole[]) {
    const isPlatformAdmin = roles.some((r) => ADMIN_ROLES.includes(r));
    if (isPlatformAdmin) {
      return {
        complete: true,
        mode: "linked" as const,
        pendingInvite: null,
        isPlatformAdmin: true,
      };
    }

    const memberships = await this.prisma.organizationMember.count({
      where: { userId },
    });

    if (memberships > 0) {
      return {
        complete: true,
        mode: "linked" as const,
        pendingInvite: null,
      };
    }

    const pendingInvite = await this.findPendingInviteForEmail(email);
    if (pendingInvite) {
      return {
        complete: false,
        mode: "invite" as const,
        pendingInvite: this.serializeInvite(pendingInvite),
        isPlatformAdmin,
      };
    }

    return {
      complete: false,
      mode: "self_service" as const,
      pendingInvite: null,
      isPlatformAdmin,
    };
  }

  async geocodeAddress(dto: GeocodeAddressDto) {
    const result = await this.geocoding.geocode(dto);
    return { data: result };
  }

  async selfService(userId: string, email: string, dto: SelfServiceFacilityOnboardingDto) {
    await this.assertCanSelfService(userId, email);

    const result = await this.createTenantForUser(userId, email, dto);

    await this.audit.log({
      userId,
      action: "facility.onboarding.self_service",
      entityType: "Facility",
      entityId: result.facility.id,
      changes: {
        organizationId: result.organization.id,
        facilityId: result.facility.id,
      },
    });

    return { data: result };
  }

  async adminInvite(adminUserId: string, dto: AdminInviteFacilityManagerDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const existingMember = await this.prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: "insensitive" },
        organizationMembers: { some: {} },
      },
    });
    if (existingMember) {
      throw new BadRequestException(
        "This email is already linked to a facility organization"
      );
    }

    const pending = await this.prisma.facilityManagerInvite.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: "insensitive" },
        status: FacilityInviteStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });
    if (pending) {
      throw new BadRequestException(
        "A pending invite already exists for this email. Revoke it first or wait for expiry."
      );
    }

    const { organization, facility, location } = await this.createOrganizationAndFacility(
      dto,
      normalizedEmail
    );

    const invite = await this.prisma.facilityManagerInvite.create({
      data: {
        email: normalizedEmail,
        organizationId: organization.id,
        facilityId: facility.id,
        invitedById: adminUserId,
        expiresAt: this.inviteExpiresAt(),
      },
      include: {
        organization: true,
        facility: { include: { locations: true } },
      },
    });

    const onboardingUrl = this.buildOnboardingUrl(invite.token);
    const clerkInvited = await this.sendClerkInvitation(normalizedEmail, invite.token);

    void this.notifications.notifyUser({
      userId: adminUserId,
      email: normalizedEmail,
      title: "You're invited to manage a facility on Sompacare",
      body: `You've been invited to manage ${facility.name}. Create your account or sign in to get started.`,
      data: {
        type: "facility.manager_invite",
        inviteToken: invite.token,
        url: onboardingUrl,
        facilityId: facility.id,
      },
    });

    await this.audit.log({
      userId: adminUserId,
      action: "facility.onboarding.admin_invite",
      entityType: "FacilityManagerInvite",
      entityId: invite.id,
      changes: {
        email: normalizedEmail,
        organizationId: organization.id,
        facilityId: facility.id,
        clerkInvited,
      },
    });

    return {
      data: {
        invite: this.serializeInvite(invite),
        organization,
        facility: { ...facility, locations: [location] },
        onboardingUrl,
        clerkInvited,
      },
    };
  }

  async listInvites(page = 1, limit = 20) {
    const take = Math.min(Math.max(limit, 1), 50);
    const skip = (Math.max(page, 1) - 1) * take;

    const [data, total] = await Promise.all([
      this.prisma.facilityManagerInvite.findMany({
        take,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          organization: { select: { id: true, name: true } },
          facility: { select: { id: true, name: true, type: true } },
          invitedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          acceptedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.facilityManagerInvite.count(),
    ]);

    return {
      data: data.map((invite) => ({
        ...this.serializeInvite(invite),
        organization: invite.organization,
        facility: invite.facility,
        invitedBy: invite.invitedBy,
        acceptedBy: invite.acceptedBy,
      })),
      meta: { page, limit: take, total, totalPages: Math.ceil(total / take) },
    };
  }

  async getInvitePreview(token: string) {
    const invite = await this.findInviteByToken(token);
    if (!invite) {
      throw new NotFoundException("Invite not found or expired");
    }

    return {
      data: {
        ...this.serializeInvite(invite),
        organizationName: invite.organization.name,
        facilityName: invite.facility.name,
        facilityType: invite.facility.type,
        location: invite.facility.locations[0] ?? null,
      },
    };
  }

  async acceptInvite(userId: string, email: string, token: string) {
    const invite = await this.findInviteByToken(token);
    if (!invite) {
      throw new NotFoundException("Invite not found or expired");
    }

    if (email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new ForbiddenException(
        "This invite was sent to a different email address. Sign in with the invited email."
      );
    }

    await this.assertNotAlreadyLinked(userId);

    await this.linkUserToOrganization(userId, invite.organizationId);

    await this.prisma.facilityManagerInvite.update({
      where: { id: invite.id },
      data: {
        status: FacilityInviteStatus.ACCEPTED,
        acceptedAt: new Date(),
        acceptedById: userId,
      },
    });

    await this.audit.log({
      userId,
      action: "facility.onboarding.invite_accepted",
      entityType: "FacilityManagerInvite",
      entityId: invite.id,
      changes: { organizationId: invite.organizationId, facilityId: invite.facilityId },
    });

    return {
      data: {
        organizationId: invite.organizationId,
        facilityId: invite.facilityId,
        facilityName: invite.facility.name,
      },
    };
  }

  async linkPendingInviteFromSignup(email: string, userId: string) {
    const invite = await this.findPendingInviteForEmail(email);
    if (!invite) return { linked: false };

    const memberships = await this.prisma.organizationMember.count({ where: { userId } });
    if (memberships > 0) return { linked: false };

    try {
      await this.linkUserToOrganization(userId, invite.organizationId);
      await this.prisma.facilityManagerInvite.update({
        where: { id: invite.id },
        data: {
          status: FacilityInviteStatus.ACCEPTED,
          acceptedAt: new Date(),
          acceptedById: userId,
        },
      });

      await this.audit.log({
        userId,
        action: "facility.onboarding.invite_auto_linked",
        entityType: "FacilityManagerInvite",
        entityId: invite.id,
      });

      return { linked: true, inviteId: invite.id, facilityId: invite.facilityId };
    } catch (error) {
      this.logger.warn(
        `Auto-link facility invite failed for ${email}: ${(error as Error).message}`
      );
      return { linked: false };
    }
  }

  private async assertNotAlreadyLinked(userId: string) {
    const memberships = await this.prisma.organizationMember.count({ where: { userId } });
    if (memberships > 0) {
      throw new BadRequestException("Your account is already linked to a facility organization");
    }
  }

  private async assertCanSelfService(userId: string, email: string) {
    await this.assertNotAlreadyLinked(userId);

    const pendingForEmail = await this.findPendingInviteForEmail(email);
    if (pendingForEmail) {
      throw new BadRequestException(
        "You have a pending invite. Open the invite link or accept the invitation instead of self-service setup."
      );
    }
  }

  private async createTenantForUser(
    userId: string,
    email: string,
    dto: TenantSetupInput
  ) {
    const { organization, facility, location } = await this.createOrganizationAndFacility(
      dto,
      dto.facilityEmail ?? email
    );

    await this.linkUserToOrganization(userId, organization.id);

    return { organization, facility, location };
  }

  private async createOrganizationAndFacility(dto: TenantSetupInput, contactEmail: string) {
    const coords = await this.resolveLocationCoordinates(dto.location);

    return this.prisma.$transaction(async (tx) => {
      const orgSlug = await uniqueSlug(dto.organizationName, async (slug) =>
        Boolean(await tx.organization.findUnique({ where: { slug } }))
      );
      const facilitySlug = await uniqueSlug(dto.facilityName, async (slug) =>
        Boolean(await tx.facility.findUnique({ where: { slug } }))
      );

      const organization = await tx.organization.create({
        data: {
          name: dto.organizationName.trim(),
          slug: orgSlug,
          type: "healthcare_provider",
          email: contactEmail,
        },
      });

      const facility = await tx.facility.create({
        data: {
          organizationId: organization.id,
          name: dto.facilityName.trim(),
          slug: facilitySlug,
          type: dto.facilityType,
          email: dto.facilityEmail?.trim() ?? contactEmail,
          phone: dto.facilityPhone?.trim(),
        },
      });

      const location = await tx.facilityLocation.create({
        data: {
          facilityId: facility.id,
          name: dto.location.name.trim(),
          addressLine1: dto.location.addressLine1.trim(),
          addressLine2: dto.location.addressLine2?.trim(),
          city: dto.location.city.trim(),
          state: dto.location.state.trim().toUpperCase(),
          zipCode: dto.location.zipCode.trim(),
          latitude: coords.latitude,
          longitude: coords.longitude,
          isPrimary: true,
        },
      });

      return { organization, facility, location };
    });
  }

  private async resolveLocationCoordinates(location: FacilityLocationInputDto) {
    if (
      location.latitude != null &&
      location.longitude != null &&
      Number.isFinite(location.latitude) &&
      Number.isFinite(location.longitude)
    ) {
      return { latitude: location.latitude, longitude: location.longitude };
    }

    const result = await this.geocoding.geocode({
      addressLine1: location.addressLine1,
      addressLine2: location.addressLine2,
      city: location.city,
      state: location.state,
      zipCode: location.zipCode,
    });

    return { latitude: result.latitude, longitude: result.longitude };
  }

  private async linkUserToOrganization(userId: string, organizationId: string) {
    const fmRole = await this.prisma.role.findUnique({
      where: { name: DbPlatformRole.FACILITY_MANAGER },
    });
    if (!fmRole) {
      throw new BadRequestException("FACILITY_MANAGER role is not configured");
    }

    await this.prisma.$transaction([
      this.prisma.userRole.upsert({
        where: { userId_roleId: { userId, roleId: fmRole.id } },
        update: {},
        create: { userId, roleId: fmRole.id },
      }),
      this.prisma.organizationMember.upsert({
        where: { organizationId_userId: { organizationId, userId } },
        update: { title: "Facility Manager", isPrimary: true },
        create: {
          organizationId,
          userId,
          title: "Facility Manager",
          isPrimary: true,
        },
      }),
    ]);
  }

  private async findPendingInviteForEmail(email: string) {
    return this.prisma.facilityManagerInvite.findFirst({
      where: {
        email: { equals: email.trim(), mode: "insensitive" },
        status: FacilityInviteStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      include: {
        organization: true,
        facility: { include: { locations: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  private async findInviteByToken(token: string) {
    const invite = await this.prisma.facilityManagerInvite.findUnique({
      where: { token },
      include: {
        organization: true,
        facility: { include: { locations: true } },
      },
    });

    if (!invite) return null;
    if (invite.status !== FacilityInviteStatus.PENDING) return null;
    if (invite.expiresAt <= new Date()) {
      await this.prisma.facilityManagerInvite.update({
        where: { id: invite.id },
        data: { status: FacilityInviteStatus.EXPIRED },
      });
      return null;
    }

    return invite;
  }

  private serializeInvite(
    invite: {
      id: string;
      token: string;
      email: string;
      status: FacilityInviteStatus;
      expiresAt: Date;
      acceptedAt: Date | null;
      createdAt: Date;
      organizationId: string;
      facilityId: string;
    }
  ) {
    return {
      id: invite.id,
      token: invite.token,
      email: invite.email,
      status: invite.status,
      expiresAt: invite.expiresAt.toISOString(),
      acceptedAt: invite.acceptedAt?.toISOString() ?? null,
      createdAt: invite.createdAt.toISOString(),
      organizationId: invite.organizationId,
      facilityId: invite.facilityId,
    };
  }

  private inviteExpiresAt() {
    const date = new Date();
    date.setDate(date.getDate() + INVITE_TTL_DAYS);
    return date;
  }

  private buildOnboardingUrl(token: string) {
    const base =
      this.config.get<string>("FACILITY_PORTAL_URL") ??
      "http://localhost:3002";
    return `${base.replace(/\/$/, "")}/onboarding?invite=${encodeURIComponent(token)}`;
  }

  private async sendClerkInvitation(email: string, token: string) {
    const secretKey = this.config.get<string>("CLERK_SECRET_KEY");
    if (!secretKey) {
      this.logger.warn("CLERK_SECRET_KEY missing — skipping Clerk invitation");
      return false;
    }

    try {
      const clerk = createClerkClient({ secretKey });
      await clerk.invitations.createInvitation({
        emailAddress: email,
        redirectUrl: this.buildOnboardingUrl(token),
        publicMetadata: {
          sompacare_facility_invite_token: token,
        },
      });
      return true;
    } catch (error) {
      this.logger.warn(
        `Clerk invitation failed for ${email}: ${(error as Error).message}`
      );
      return false;
    }
  }
}
