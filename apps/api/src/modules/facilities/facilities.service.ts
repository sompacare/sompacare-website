import { Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "../../common/decorators";
import { paginate, paginationMeta } from "../../common/decorators";
import { GeocodingService } from "../../common/geocoding/geocoding.service";
import { PrismaService } from "../../common/prisma/prisma.module";
import { TenantService } from "../../common/tenant/tenant.service";

@Injectable()
export class FacilitiesService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
    private geocoding: GeocodingService
  ) {}

  async findAll(user: AuthenticatedUser, page = 1, limit = 20, internalOnly = false) {
    const { take, skip } = paginate(Number(page), Number(limit));
    const orgFilter = this.tenantService.facilityWhere(user.tenant);
    const where = {
      ...orgFilter,
      ...(internalOnly ? { isInternal: true } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.facility.findMany({
        where,
        take,
        skip,
        include: { locations: true, organization: { select: { id: true, name: true } } },
        orderBy: [{ isInternal: "desc" }, { name: "asc" }],
      }),
      this.prisma.facility.count({ where }),
    ]);

    return { data, meta: paginationMeta(total, Number(page), take) };
  }

  async findInternalHomecareFacility() {
    const facility = await this.prisma.facility.findFirst({
      where: { isInternal: true, isActive: true },
      include: {
        locations: { where: { isActive: true }, orderBy: [{ isPrimary: "desc" }, { name: "asc" }] },
        organization: { select: { id: true, name: true } },
      },
    });
    if (!facility) {
      throw new NotFoundException(
        "Sompacare home care facility is not configured. Run database seed or migrations."
      );
    }
    return { data: facility };
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
      latitude?: number;
      longitude?: number;
    }
  ) {
    await this.findOne(user, facilityId);

    const coords =
      dto.latitude != null &&
      dto.longitude != null &&
      Number.isFinite(dto.latitude) &&
      Number.isFinite(dto.longitude)
        ? { latitude: dto.latitude, longitude: dto.longitude }
        : await this.geocoding.geocode({
            addressLine1: dto.addressLine1,
            addressLine2: dto.addressLine2,
            city: dto.city,
            state: dto.state,
            zipCode: dto.zipCode,
          });

    const location = await this.prisma.facilityLocation.create({
      data: {
        facilityId,
        name: dto.name,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state.toUpperCase(),
        zipCode: dto.zipCode,
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
    });
    return { data: location };
  }
}
