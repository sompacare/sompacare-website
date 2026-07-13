import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { WORKER_ROLES, platformRoleToClinicalRole } from "@sompacare/shared";
import { PrismaService } from "../../common/prisma/prisma.module";
import { ComplianceService } from "../compliance/compliance.service";
import { UpdateWorkerProfileDto } from "./dto/worker.dto";

@Injectable()
export class WorkersService {
  constructor(
    private prisma: PrismaService,
    private complianceService: ComplianceService
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: { include: { availability: true } },
        licenses: true,
        certifications: true,
        roles: { include: { role: true } },
      },
    });

    if (!user) throw new NotFoundException("User not found");
    if (!user.profile) {
      throw new NotFoundException("Worker profile not found");
    }

    const compliance = await this.complianceService.syncComplianceScore(userId);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        roles: user.roles.map((r) => r.role.name),
      },
      profile: { ...user.profile, complianceScore: compliance.score },
      licenses: user.licenses,
      certifications: user.certifications,
      compliance,
    };
  }

  async updateProfile(userId: string, dto: UpdateWorkerProfileDto) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException("Worker profile not found");

    return this.prisma.workerProfile.update({
      where: { userId },
      data: {
        bio: dto.bio,
        yearsExperience: dto.yearsExperience,
        specialties: dto.specialties,
        clinicalRole: dto.clinicalRole,
        preferredShiftTypes: dto.preferredShiftTypes,
        minHourlyRate: dto.minHourlyRate,
        maxTravelMiles: dto.maxTravelMiles,
      },
      include: { availability: true },
    });
  }

  async ensureWorkerProfile(userId: string) {
    const existing = await this.prisma.workerProfile.findUnique({ where: { userId } });
    if (existing) return existing;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException("User not found");

    const workerRole = user.roles.find((r) =>
      WORKER_ROLES.includes(r.role.name as (typeof WORKER_ROLES)[number])
    );
    if (!workerRole) {
      throw new BadRequestException("User does not have a worker role");
    }

    const clinicalRole = platformRoleToClinicalRole(workerRole.role.name) ?? "RN";

    return this.prisma.workerProfile.create({
      data: {
        userId,
        clinicalRole,
        specialties: [],
        preferredShiftTypes: [],
      },
    });
  }
}
