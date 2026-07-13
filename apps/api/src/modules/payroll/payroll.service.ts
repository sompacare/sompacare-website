import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  PayRunStatus,
  Prisma,
  TimecardStatus,
  InvoiceStatus,
} from "@sompacare/database";
import { aggregateWorkerPayFromSnapshots } from "@sompacare/shared";
import { AuditService } from "../../common/audit/audit.service";
import { paginate, paginationMeta } from "../../common/decorators";
import { PrismaService } from "../../common/prisma/prisma.module";
import { NotificationsService } from "../notifications/notifications.service";
import { WalletService } from "../wallet/wallet.service";
import { CreatePayRunDto } from "./dto/payroll.dto";
import { PayoutGateService } from "./payout-gate.service";

const payRunInclude = {
  entries: true,
  timecards: {
    include: {
      worker: { select: { id: true, firstName: true, lastName: true, email: true } },
      assignment: {
        include: {
          shift: { select: { title: true, facility: { select: { name: true } } } },
        },
      },
    },
  },
} satisfies Prisma.PayRunInclude;

@Injectable()
export class PayrollService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private walletService: WalletService,
    private notifications: NotificationsService,
    private payoutGate: PayoutGateService
  ) {}

  async findAll(page = 1, limit = 20) {
    const { take, skip } = paginate(page, limit);
    const [data, total] = await Promise.all([
      this.prisma.payRun.findMany({
        include: { entries: true, _count: { select: { timecards: true } } },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      this.prisma.payRun.count(),
    ]);
    return { data, meta: paginationMeta(total, page, take) };
  }

  async findOne(id: string) {
    const run = await this.prisma.payRun.findUnique({
      where: { id },
      include: payRunInclude,
    });
    if (!run) throw new NotFoundException("Pay run not found");
    return run;
  }

  async generate(dto: CreatePayRunDto, createdById: string) {
    const periodEnd = dto.periodEnd ? new Date(dto.periodEnd) : new Date();
    const periodStart = dto.periodStart
      ? new Date(dto.periodStart)
      : new Date(periodEnd.getTime() - 14 * 24 * 60 * 60 * 1000);

    const timecards = await this.prisma.timecard.findMany({
      where: {
        status: TimecardStatus.APPROVED,
        payRunId: null,
        approvedAt: { gte: periodStart, lte: periodEnd },
        invoice: { status: InvoiceStatus.PAID },
      },
      include: {
        worker: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (timecards.length === 0) {
      throw new BadRequestException(
        "No approved timecards with paid facility invoices available for this pay period"
      );
    }

    const byWorker = new Map<string, typeof timecards>();
    for (const tc of timecards) {
      const list = byWorker.get(tc.workerId) ?? [];
      list.push(tc);
      byWorker.set(tc.workerId, list);
    }

    const run = await this.prisma.$transaction(async (tx) => {
      const payRun = await tx.payRun.create({
        data: {
          periodStart,
          periodEnd,
          status: PayRunStatus.PENDING_APPROVAL,
        },
      });

      let totalGross = 0;
      let totalNet = 0;
      let totalDeductions = 0;

      for (const [workerId, workerTimecards] of byWorker) {
        const deductions = await this.sumActiveDeductions(tx, workerId);
        const pay = aggregateWorkerPayFromSnapshots(
          workerTimecards.map((tc) => ({
            regularHours: Number(tc.regularHours),
            overtimeHours: Number(tc.overtimeHours),
            grossAmount: Number(tc.grossAmount),
          })),
          deductions
        );

        await tx.payRunEntry.create({
          data: {
            payRunId: payRun.id,
            workerId,
            regularHours: pay.regularHours,
            overtimeHours: pay.overtimeHours,
            grossPay: pay.grossPay,
            deductions: pay.deductions,
            netPay: pay.netPay,
          },
        });

        await tx.timecard.updateMany({
          where: { id: { in: workerTimecards.map((t) => t.id) } },
          data: { payRunId: payRun.id },
        });

        totalGross += pay.grossPay;
        totalNet += pay.netPay;
        totalDeductions += pay.deductions;
      }

      return tx.payRun.update({
        where: { id: payRun.id },
        data: {
          totalGross,
          totalNet,
          totalDeductions,
          workerCount: byWorker.size,
        },
        include: payRunInclude,
      });
    });

    await this.audit.log({
      userId: createdById,
      action: "payroll.run.created",
      entityType: "PayRun",
      entityId: run.id,
      changes: { workerCount: run.workerCount, totalNet: Number(run.totalNet) },
    });

    return run;
  }

  async approve(id: string, approverId: string) {
    const run = await this.findOne(id);
    if (run.status !== PayRunStatus.PENDING_APPROVAL) {
      throw new BadRequestException("Only pending pay runs can be approved");
    }

    await this.payoutGate.assertPayRunInvoicesPaid(id);

    const updated = await this.prisma.payRun.update({
      where: { id },
      data: {
        status: PayRunStatus.APPROVED,
        approvedBy: approverId,
        approvedAt: new Date(),
      },
      include: payRunInclude,
    });

    await this.audit.log({
      userId: approverId,
      action: "payroll.run.approved",
      entityType: "PayRun",
      entityId: id,
    });

    return updated;
  }

  async process(id: string, processorId: string) {
    const run = await this.findOne(id);
    if (run.status !== PayRunStatus.APPROVED) {
      throw new BadRequestException("Pay run must be approved before processing");
    }

    await this.payoutGate.assertPayRunInvoicesPaid(id);

    await this.prisma.payRun.update({
      where: { id },
      data: { status: PayRunStatus.PROCESSING },
    });

    const results = [];

    for (const entry of run.entries) {
      const worker = await this.prisma.user.findUnique({
        where: { id: entry.workerId },
        include: { profile: true },
      });

      const credit = await this.walletService.creditFromPayRunEntry(
        entry.workerId,
        Number(entry.netPay),
        entry.id,
        id
      );

      const workerTimecards = run.timecards.filter((tc) => tc.workerId === entry.workerId);
      await this.prisma.timecard.updateMany({
        where: { id: { in: workerTimecards.map((t) => t.id) } },
        data: { status: TimecardStatus.PAID },
      });

      if (worker) {
        void this.notifications.notifyWalletCredited(
          worker.id,
          worker.email,
          Number(entry.netPay),
          `Pay run ${run.id.slice(-6)}`,
          entry.id
        );
      }

      results.push({ entryId: entry.id, credit });
    }

    const completed = await this.prisma.payRun.update({
      where: { id },
      data: { status: PayRunStatus.COMPLETED, processedAt: new Date() },
      include: payRunInclude,
    });

    await this.audit.log({
      userId: processorId,
      action: "payroll.run.processed",
      entityType: "PayRun",
      entityId: id,
    });

    return { payRun: completed, results };
  }

  async exportCsv(id: string) {
    const run = await this.findOne(id);
    const workers = await this.prisma.user.findMany({
      where: { id: { in: run.entries.map((e) => e.workerId) } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const workerMap = new Map(workers.map((w) => [w.id, w]));

    const header =
      "worker_name,worker_email,regular_hours,overtime_hours,gross_pay,deductions,net_pay";
    const rows = run.entries.map((e) => {
      const w = workerMap.get(e.workerId);
      const name = w ? `${w.firstName} ${w.lastName}` : e.workerId;
      return [
        `"${name}"`,
        w?.email ?? "",
        Number(e.regularHours),
        Number(e.overtimeHours),
        Number(e.grossPay),
        Number(e.deductions),
        Number(e.netPay),
      ].join(",");
    });

    const csv = [header, ...rows].join("\n");
    return {
      filename: `payrun-${run.id.slice(-8)}.csv`,
      contentType: "text/csv",
      csv,
    };
  }

  private async sumActiveDeductions(
    tx: Prisma.TransactionClient,
    workerId: string
  ) {
    const deductions = await tx.deduction.findMany({
      where: { workerId, isActive: true },
    });
    return deductions.reduce((sum, d) => sum + Number(d.amount), 0);
  }
}
