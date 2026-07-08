import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, ShiftStatus } from "@sompacare/database";
import { PrismaService } from "../../common/prisma/prisma.module";
import { paginate, paginationMeta } from "../../common/decorators";
import { ComplianceService } from "../compliance/compliance.service";
import { ApplyShiftDto, CreateShiftDto, ShiftQueryDto, UpdateShiftDto } from "./dto/shift.dto";

@Injectable()
export class ShiftsService {
  constructor(
    private prisma: PrismaService,
    private complianceService: ComplianceService
  ) {}

  async create(dto: CreateShiftDto, createdById: string) {
    const location = await this.prisma.facilityLocation.findFirst({
      where: { id: dto.locationId, facilityId: dto.facilityId, isActive: true },
    });
    if (!location) {
      throw new BadRequestException("Invalid facility location");
    }

    return this.prisma.shift.create({
      data: {
        facilityId: dto.facilityId,
        locationId: dto.locationId,
        createdById,
        title: dto.title,
        description: dto.description,
        role: dto.role,
        shiftType: dto.shiftType,
        hourlyRate: dto.hourlyRate,
        bonusRate: dto.bonusRate,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        breakMinutes: dto.breakMinutes ?? 30,
        slotsTotal: dto.slotsTotal ?? 1,
        requirements: dto.requirements ?? [],
        isEmergency: dto.isEmergency ?? false,
        status: ShiftStatus.DRAFT,
      },
      include: { facility: true, location: true },
    });
  }

  async findAll(query: ShiftQueryDto) {
    const { take, skip } = paginate(query.page, query.limit);
    const where: Prisma.ShiftWhereInput = {};

    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status as ShiftStatus;
    if (query.facilityId) where.facilityId = query.facilityId;

    const [data, total] = await Promise.all([
      this.prisma.shift.findMany({
        where,
        include: {
          facility: { select: { id: true, name: true, rating: true } },
          location: { select: { id: true, city: true, state: true, latitude: true, longitude: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { startTime: "asc" },
        take,
        skip,
      }),
      this.prisma.shift.count({ where }),
    ]);

    return {
      data,
      meta: paginationMeta(total, query.page ?? 1, take),
    };
  }

  async findPublished(query: ShiftQueryDto) {
    return this.findAll({ ...query, status: ShiftStatus.PUBLISHED });
  }

  async findOne(id: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
      include: {
        facility: true,
        location: true,
        applications: {
          include: {
            applicant: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    });
    if (!shift) throw new NotFoundException("Shift not found");
    return shift;
  }

  async update(id: string, dto: UpdateShiftDto) {
    await this.findOne(id);
    return this.prisma.shift.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        hourlyRate: dto.hourlyRate,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      },
      include: { facility: true, location: true },
    });
  }

  async publish(id: string) {
    const shift = await this.findOne(id);
    if (shift.status !== ShiftStatus.DRAFT) {
      throw new BadRequestException("Only draft shifts can be published");
    }
    return this.prisma.shift.update({
      where: { id },
      data: { status: ShiftStatus.PUBLISHED, publishedAt: new Date() },
      include: { facility: true, location: true },
    });
  }

  async cancel(id: string, reason?: string) {
    const shift = await this.findOne(id);
    if (shift.status === ShiftStatus.CANCELLED) {
      throw new BadRequestException("Shift is already cancelled");
    }
    return this.prisma.shift.update({
      where: { id },
      data: {
        status: ShiftStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });
  }

  async apply(shiftId: string, applicantId: string, dto: ApplyShiftDto) {
    const shift = await this.findOne(shiftId);
    if (shift.status !== ShiftStatus.PUBLISHED) {
      throw new BadRequestException("Shift is not open for applications");
    }
    if (shift.slotsFilled >= shift.slotsTotal) {
      throw new BadRequestException("All slots are filled");
    }

    const compliance = await this.complianceService.assertWorkerCanBook(
      applicantId,
      [shift.role]
    );
    if (!compliance.isCompliant) {
      throw new ForbiddenException({
        message: "Cannot apply — compliance requirements not met",
        blockedReasons: compliance.blockedReasons,
      });
    }

    const existing = await this.prisma.shiftApplication.findUnique({
      where: { shiftId_applicantId: { shiftId, applicantId } },
    });
    if (existing) {
      throw new BadRequestException("You have already applied to this shift");
    }

    return this.prisma.shiftApplication.create({
      data: {
        shiftId,
        applicantId,
        message: dto.message,
        matchScore: compliance.score,
      },
      include: {
        shift: { include: { facility: true } },
        applicant: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }
}
