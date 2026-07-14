import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "../../common/decorators";
import { paginate, paginationMeta } from "../../common/decorators";
import { PrismaService } from "../../common/prisma/prisma.module";
import { TenantService } from "../../common/tenant/tenant.service";

@Injectable()
export class FacilitiesService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService
  ) {}

  async findAll(user: AuthenticatedUser, page = 1, limit = 20) {
    const { take, skip } = paginate(Number(page), Number(limit));
    const orgFilter = this.tenantService.facilityWhere(user.tenant);

    const [data, total] = await Promise.all([
      this.prisma.facility.findMany({
        where: orgFilter,
        take,
        skip,
        include: { locations: true, organization: { select: { id: true, name: true } } },
      }),
      this.prisma.facility.count({ where: orgFilter }),
    ]);

    return { data, meta: paginationMeta(total, Number(page), take) };
  }

  async findOne(user: AuthenticatedUser, id: string) {
    const facility = await this.prisma.facility.findUnique({
      where: { id },
      include: { locations: true, organization: true },
    });
    if (!facility) throw new NotFoundException("Facility not found");
    this.tenantService.assertFacilityAccess(user.tenant, facility.id);
    return { data: facility };
  }

  async create(
    user: AuthenticatedUser,
    dto: {
      organizationId: string;
      name: string;
      slug: string;
      type: string;
    }
  ) {
    this.tenantService.assertOrganizationAccess(user.tenant, dto.organizationId);
    const facility = await this.prisma.facility.create({ data: dto });
    return { data: facility };
  }

  async addLocation(
    user: AuthenticatedUser,
    facilityId: string,
    dto: {
      name: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      zipCode: string;
      latitude: number;
      longitude: number;
    }
  ) {
    await this.findOne(user, facilityId);
    const location = await this.prisma.facilityLocation.create({
      data: { ...dto, facilityId },
    });
    return { data: location };
  }
}
