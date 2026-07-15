import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ApplicationStatus, AssignmentStatus, Prisma, ShiftStatus } from "@sompacare/database";
import { sanitizeShiftRatesForRoles, type PlatformRole, type ShiftRateFields } from "@sompacare/shared";
import { AuditService } from "../../common/audit/audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { paginate, paginationMeta } from "../../common/decorators";
import { PrismaService } from "../../common/prisma/prisma.module";
import { ApplicationQueryDto } from "./dto/application.dto";

const applicationInclude = {
  shift: {
    include: {
      facility: { select: { id: true, name: true, slug: true } },
      location: { select: { id: true, city: true, state: true } },
    },
  },
  applicant: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      email: true,
      profile: { select: { clinicalRole: true, complianceScore: true, reliabilityScore: true } },
    },
  },
  assignment: true,
} satisfies Prisma.ShiftApplicationInclude;

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService
  ) {}

  async findAll(query: ApplicationQueryDto, viewerRoles?: PlatformRole[]) {
    const { take, skip } = paginate(query.page, query.limit);
    const where: Prisma.ShiftApplicationWhereInput = {};

    if (query.shiftId) where.shiftId = query.shiftId;
    if (query.applicantId) where.applicantId = query.applicantId;
    if (query.status) where.status = query.status;
    if (query.facilityId) {
      where.shift = { facilityId: query.facilityId };
    }

    const [data, total] = await Promise.all([
      this.prisma.shiftApplication.findMany({
        where,
        include: applicationInclude,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      this.prisma.shiftApplication.count({ where }),
    ]);

    return {
      data: data.map((row) => this.sanitizeApplication(row, viewerRoles)),
      meta: paginationMeta(total, query.page ?? 1, take),
    };
  }

  async findOne(id: string, viewerRoles?: PlatformRole[]) {
    const application = await this.getById(id);
    return this.sanitizeApplication(application, viewerRoles);
  }

  private async getById(id: string) {
    const application = await this.prisma.shiftApplication.findUnique({
      where: { id },
      include: applicationInclude,
    });
    if (!application) throw new NotFoundException("Application not found");
    return application;
  }

  async approve(id: string, reviewerId: string, viewerRoles?: PlatformRole[]) {
    const application = await this.getById(id);

    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException("Only pending applications can be approved");
    }

    const shift = application.shift;
    if (shift.status !== ShiftStatus.PUBLISHED && shift.status !== ShiftStatus.FILLED) {
      throw new BadRequestException("Shift is not accepting approvals");
    }

    const confirmedCount = await this.prisma.shiftAssignment.count({
      where: {
        shiftId: shift.id,
        status: {
          in: [
            AssignmentStatus.CONFIRMED,
            AssignmentStatus.CHECKED_IN,
            AssignmentStatus.IN_PROGRESS,
            AssignmentStatus.COMPLETED,
          ],
        },
      },
    });

    if (confirmedCount >= shift.slotsTotal) {
      throw new BadRequestException("All shift slots are filled");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedApplication = await tx.shiftApplication.update({
        where: { id },
        data: {
          status: ApplicationStatus.APPROVED,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        },
        include: applicationInclude,
      });

      const assignment = await tx.shiftAssignment.create({
        data: {
          shiftId: shift.id,
          applicationId: id,
          workerId: application.applicantId,
          status: AssignmentStatus.PENDING_CONFIRMATION,
        },
      });

      return { application: updatedApplication, assignment };
    });

    await this.audit.log({
      userId: reviewerId,
      action: "application.approved",
      entityType: "ShiftApplication",
      entityId: id,
      changes: { assignmentId: result.assignment.id },
    });

    void this.notifications.notifyApplicationApproved(
      result.application,
      result.assignment.id
    );

    return {
      application: this.sanitizeApplication(result.application, viewerRoles),
      assignment: result.assignment,
    };
  }

  async reject(id: string, reviewerId: string, reason: string, viewerRoles?: PlatformRole[]) {
    const application = await this.getById(id);

    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException("Only pending applications can be rejected");
    }

    const updated = await this.prisma.shiftApplication.update({
      where: { id },
      data: {
        status: ApplicationStatus.REJECTED,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectReason: reason,
      },
      include: applicationInclude,
    });

    await this.audit.log({
      userId: reviewerId,
      action: "application.rejected",
      entityType: "ShiftApplication",
      entityId: id,
      changes: { reason },
    });

    return this.sanitizeApplication(updated, viewerRoles);
  }

  async withdraw(id: string, applicantId: string, viewerRoles?: PlatformRole[]) {
    const application = await this.getById(id);

    if (application.applicantId !== applicantId) {
      throw new ForbiddenException("You can only withdraw your own application");
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException("Only pending applications can be withdrawn");
    }

    const updated = await this.prisma.shiftApplication.update({
      where: { id },
      data: { status: ApplicationStatus.WITHDRAWN },
      include: applicationInclude,
    });

    await this.audit.log({
      userId: applicantId,
      action: "application.withdrawn",
      entityType: "ShiftApplication",
      entityId: id,
    });

    return this.sanitizeApplication(updated, viewerRoles);
  }

  private sanitizeApplication<T extends { shift: ShiftRateFields }>(
    application: T,
    viewerRoles?: PlatformRole[]
  ): T {
    if (!viewerRoles?.length) return application;
    return {
      ...application,
      shift: sanitizeShiftRatesForRoles(application.shift, viewerRoles),
    };
  }
}
