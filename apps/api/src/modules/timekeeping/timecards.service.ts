import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, TimecardStatus } from "@sompacare/database";
import { AuditService } from "../../common/audit/audit.service";
import { InvoicesService } from "../invoices/invoices.service";
import { NotificationsService } from "../notifications/notifications.service";
import { WalletService } from "../wallet/wallet.service";
import { paginate, paginationMeta } from "../../common/decorators";
import { PrismaService } from "../../common/prisma/prisma.module";
import { TimecardQueryDto } from "./dto/timecard.dto";

const timecardInclude = {
  assignment: {
    include: {
      shift: {
        include: {
          facility: {
            select: {
              id: true,
              name: true,
              organizationId: true,
              email: true,
              stripeCustomerId: true,
            },
          },
          location: { select: { city: true, state: true } },
        },
      },
      clockEvents: { orderBy: { timestamp: "asc" as const } },
    },
  },
  worker: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
} satisfies Prisma.TimecardInclude;

@Injectable()
export class TimecardsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private invoicesService: InvoicesService,
    private notifications: NotificationsService
  ) {}

  async findAll(query: TimecardQueryDto) {
    const { take, skip } = paginate(query.page, query.limit);
    const where: Prisma.TimecardWhereInput = {};

    if (query.workerId) where.workerId = query.workerId;
    if (query.status) where.status = query.status;
    if (query.facilityId) {
      where.assignment = { shift: { facilityId: query.facilityId } };
    }

    const [data, total] = await Promise.all([
      this.prisma.timecard.findMany({
        where,
        include: timecardInclude,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      this.prisma.timecard.count({ where }),
    ]);

    return {
      data,
      meta: paginationMeta(total, query.page ?? 1, take),
    };
  }

  async findOne(id: string) {
    const timecard = await this.prisma.timecard.findUnique({
      where: { id },
      include: timecardInclude,
    });
    if (!timecard) throw new NotFoundException("Timecard not found");
    return timecard;
  }

  async approve(id: string, approverId: string) {
    const timecard = await this.findOne(id);

    if (timecard.status !== TimecardStatus.SUBMITTED) {
      throw new BadRequestException("Only submitted timecards can be approved");
    }

    const updated = await this.prisma.timecard.update({
      where: { id },
      data: {
        status: TimecardStatus.APPROVED,
        approvedBy: approverId,
        approvedAt: new Date(),
      },
      include: timecardInclude,
    });

    await this.audit.log({
      userId: approverId,
      action: "timecard.approved",
      entityType: "Timecard",
      entityId: id,
    });

    await this.invoicesService.createFromTimecard(updated);

    void this.notifications.notifyTimecardApproved(
      updated.workerId,
      updated.worker.email,
      Number(updated.grossAmount),
      updated.assignment.shift.title,
      id
    );

    return updated;
  }
}
