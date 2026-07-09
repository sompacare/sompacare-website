import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AssignmentStatus, Prisma, ShiftStatus } from "@sompacare/database";
import { AuditService } from "../../common/audit/audit.service";
import { paginate, paginationMeta } from "../../common/decorators";
import { PrismaService } from "../../common/prisma/prisma.module";
import { AssignmentQueryDto } from "./dto/assignment.dto";

const CONFIRMED_STATUSES: AssignmentStatus[] = [
  AssignmentStatus.CONFIRMED,
  AssignmentStatus.CHECKED_IN,
  AssignmentStatus.IN_PROGRESS,
  AssignmentStatus.COMPLETED,
];

const assignmentInclude = {
  shift: {
    include: {
      facility: { select: { id: true, name: true, slug: true } },
      location: {
        select: {
          id: true,
          city: true,
          state: true,
          addressLine1: true,
          latitude: true,
          longitude: true,
          geofenceRadiusMeters: true,
        },
      },
    },
  },
  worker: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      email: true,
      phone: true,
      profile: { select: { clinicalRole: true, complianceScore: true } },
    },
  },
  application: true,
} satisfies Prisma.ShiftAssignmentInclude;

@Injectable()
export class AssignmentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService
  ) {}

  async findAll(query: AssignmentQueryDto) {
    const { take, skip } = paginate(query.page, query.limit);
    const where: Prisma.ShiftAssignmentWhereInput = {};

    if (query.shiftId) where.shiftId = query.shiftId;
    if (query.workerId) where.workerId = query.workerId;
    if (query.status) where.status = query.status;
    if (query.facilityId) {
      where.shift = { facilityId: query.facilityId };
    }

    const [data, total] = await Promise.all([
      this.prisma.shiftAssignment.findMany({
        where,
        include: assignmentInclude,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      this.prisma.shiftAssignment.count({ where }),
    ]);

    return {
      data,
      meta: paginationMeta(total, query.page ?? 1, take),
    };
  }

  async findOne(id: string) {
    const assignment = await this.prisma.shiftAssignment.findUnique({
      where: { id },
      include: assignmentInclude,
    });
    if (!assignment) throw new NotFoundException("Assignment not found");
    return assignment;
  }

  async confirm(id: string, workerId: string) {
    const assignment = await this.findOne(id);

    if (assignment.workerId !== workerId) {
      throw new ForbiddenException("Only the assigned worker can confirm this shift");
    }

    if (assignment.status !== AssignmentStatus.PENDING_CONFIRMATION) {
      throw new BadRequestException("Assignment is not awaiting confirmation");
    }

    const shift = assignment.shift;
    const confirmedCount = await this.prisma.shiftAssignment.count({
      where: { shiftId: shift.id, status: { in: CONFIRMED_STATUSES } },
    });

    if (confirmedCount >= shift.slotsTotal) {
      throw new BadRequestException("All shift slots are already filled");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedAssignment = await tx.shiftAssignment.update({
        where: { id },
        data: {
          status: AssignmentStatus.CONFIRMED,
          confirmedAt: new Date(),
        },
        include: assignmentInclude,
      });

      const newSlotsFilled = confirmedCount + 1;
      await tx.shift.update({
        where: { id: shift.id },
        data: {
          slotsFilled: newSlotsFilled,
          status:
            newSlotsFilled >= shift.slotsTotal ? ShiftStatus.FILLED : ShiftStatus.PUBLISHED,
        },
      });

      return updatedAssignment;
    });

    await this.audit.log({
      userId: workerId,
      action: "assignment.confirmed",
      entityType: "ShiftAssignment",
      entityId: id,
    });

    return result;
  }

  async cancel(id: string, actorId: string, reason?: string) {
    const assignment = await this.findOne(id);

    if (
      assignment.status === AssignmentStatus.CANCELLED ||
      assignment.status === AssignmentStatus.COMPLETED
    ) {
      throw new BadRequestException("Assignment cannot be cancelled");
    }

    const wasConfirmed = CONFIRMED_STATUSES.includes(assignment.status);

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.shiftAssignment.update({
        where: { id },
        data: {
          status: AssignmentStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: reason,
        },
        include: assignmentInclude,
      });

      if (wasConfirmed) {
        const confirmedCount = await tx.shiftAssignment.count({
          where: {
            shiftId: assignment.shiftId,
            status: { in: CONFIRMED_STATUSES },
            id: { not: id },
          },
        });

        await tx.shift.update({
          where: { id: assignment.shiftId },
          data: {
            slotsFilled: confirmedCount,
            status:
              confirmedCount >= assignment.shift.slotsTotal
                ? ShiftStatus.FILLED
                : ShiftStatus.PUBLISHED,
          },
        });
      }

      return updated;
    });

    await this.audit.log({
      userId: actorId,
      action: "assignment.cancelled",
      entityType: "ShiftAssignment",
      entityId: id,
      changes: { reason },
    });

    return result;
  }
}
