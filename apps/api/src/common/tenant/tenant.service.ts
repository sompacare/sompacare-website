import { ForbiddenException, Global, Injectable } from "@nestjs/common";
import { ADMIN_ROLES, FACILITY_ROLES, PlatformRole } from "@sompacare/shared";
import { PrismaService } from "../prisma/prisma.module";
import type { AuthenticatedUser } from "../decorators";

export type TenantScope = "all" | "organization";

export type TenantContext = {
  scope: TenantScope;
  organizationIds: string[];
  facilityIds: string[];
};

const PLATFORM_WIDE_ROLES: PlatformRole[] = [
  ...ADMIN_ROLES,
  PlatformRole.RECRUITER,
  PlatformRole.COMPLIANCE_OFFICER,
];

@Global()
@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  hasPlatformWideAccess(roles: PlatformRole[]): boolean {
    return roles.some((role) => PLATFORM_WIDE_ROLES.includes(role));
  }

  isFacilityScoped(roles: PlatformRole[]): boolean {
    return roles.some((role) => FACILITY_ROLES.includes(role));
  }

  async resolveForUser(user: Pick<AuthenticatedUser, "id" | "roles">): Promise<TenantContext> {
    if (this.hasPlatformWideAccess(user.roles)) {
      return { scope: "all", organizationIds: [], facilityIds: [] };
    }

    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId: user.id },
      select: { organizationId: true },
    });

    const organizationIds = memberships.map((m) => m.organizationId);
    if (organizationIds.length === 0) {
      return { scope: "organization", organizationIds: [], facilityIds: [] };
    }

    const facilities = await this.prisma.facility.findMany({
      where: { organizationId: { in: organizationIds } },
      select: { id: true },
    });

    return {
      scope: "organization",
      organizationIds,
      facilityIds: facilities.map((f) => f.id),
    };
  }

  facilityWhere(tenant: TenantContext): { organizationId?: { in: string[] } } | undefined {
    if (tenant.scope === "all") return undefined;
    if (tenant.organizationIds.length === 0) {
      return { organizationId: { in: ["__no_access__"] } };
    }
    return { organizationId: { in: tenant.organizationIds } };
  }

  assertFacilityAccess(tenant: TenantContext, facilityId: string) {
    if (tenant.scope === "all") return;
    if (!tenant.facilityIds.includes(facilityId)) {
      throw new ForbiddenException("You do not have access to this facility");
    }
  }

  assertOrganizationAccess(tenant: TenantContext, organizationId: string) {
    if (tenant.scope === "all") return;
    if (!tenant.organizationIds.includes(organizationId)) {
      throw new ForbiddenException("You do not have access to this organization");
    }
  }
}
