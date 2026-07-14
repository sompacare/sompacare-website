import { Injectable } from "@nestjs/common";
import { Prisma } from "@sompacare/database";
import { paginate, paginationMeta } from "../../common/decorators";
import { PrismaService } from "../../common/prisma/prisma.module";
import { OpenAiService } from "../ai/openai.service";

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private openai: OpenAiService
  ) {}

  async getDashboard() {
    const thirtyDaysAgo = new Date(Date.now() - 86400000 * 30);

    const [
      totalUsers,
      totalFacilities,
      publishedShifts,
      filledSlots,
      totalSlots,
      paidInvoices,
      processedPayRuns,
      openTickets,
      pendingCompliance,
      recentPlacements,
      activeWorkers,
    ] = await Promise.all([
      this.prisma.user.count({ where: { status: "ACTIVE" } }),
      this.prisma.facility.count({ where: { isActive: true } }),
      this.prisma.shift.count({ where: { status: "PUBLISHED" } }),
      this.prisma.shift.aggregate({ _sum: { slotsFilled: true } }),
      this.prisma.shift.aggregate({ _sum: { slotsTotal: true } }),
      this.prisma.invoice.aggregate({
        where: { status: "PAID", paidAt: { gte: thirtyDaysAgo } },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.payRun.aggregate({
        where: { status: "COMPLETED", processedAt: { gte: thirtyDaysAgo } },
        _sum: { totalNet: true },
        _count: true,
      }),
      this.prisma.supportTicket.count({
        where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER"] } },
      }),
      this.prisma.license.count({ where: { status: "PENDING_VERIFICATION" } }),
      this.prisma.candidate.count({
        where: { stage: { in: ["PLACED", "HIRED"] } },
      }),
      this.prisma.workerProfile.count(),
    ]);

    const slotsFilled = filledSlots._sum.slotsFilled ?? 0;
    const slotsTotal = totalSlots._sum.slotsTotal ?? 0;
    const fillRate = slotsTotal > 0 ? Math.round((slotsFilled / slotsTotal) * 100) : 0;

    return {
      kpis: {
        totalUsers,
        activeWorkers,
        totalFacilities,
        publishedShifts,
        fillRate,
        revenue30d: Number(paidInvoices._sum.total ?? 0),
        paidInvoices30d: paidInvoices._count,
        payrollProcessed30d: Number(processedPayRuns._sum.totalNet ?? 0),
        payRuns30d: processedPayRuns._count,
        openTickets,
        pendingCompliance,
        placementsTotal: recentPlacements,
      },
      period: { days: 30, from: thirtyDaysAgo.toISOString() },
    };
  }

  async getInsights() {
    const [topFacilities, recentAudit, flagCount, urgentTickets, pendingCompliance, publishedShifts, fillData] =
      await Promise.all([
      this.prisma.facility.findMany({
        where: { isActive: true },
        orderBy: { rating: "desc" },
        take: 5,
        select: { id: true, name: true, rating: true, ratingCount: true },
      }),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
      this.prisma.featureFlag.count({ where: { isEnabled: true } }),
      this.prisma.supportTicket.count({
        where: { priority: "URGENT", status: { not: "CLOSED" } },
      }),
      this.prisma.license.count({ where: { status: "PENDING_VERIFICATION" } }),
      this.prisma.shift.count({ where: { status: "PUBLISHED" } }),
      this.prisma.shift.aggregate({ _sum: { slotsFilled: true, slotsTotal: true } }),
    ]);

    const slotsFilled = fillData._sum.slotsFilled ?? 0;
    const slotsTotal = fillData._sum.slotsTotal ?? 0;
    const fillRate = slotsTotal > 0 ? Math.round((slotsFilled / slotsTotal) * 100) : 0;

    const { summary: aiSummary, devBypass } = await this.openai.generateInsightsSummary({
      urgentTickets,
      enabledFlags: flagCount,
      pendingCompliance,
      publishedShifts,
      fillRate,
      topFacilityNames: topFacilities.map((f) => f.name),
    });

    return {
      topFacilities,
      recentActivity: recentAudit.map((a) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        user: a.user
          ? `${a.user.firstName} ${a.user.lastName}`
          : "System",
        createdAt: a.createdAt,
      })),
      enabledFlags: flagCount,
      urgentTickets,
      pendingCompliance,
      fillRate,
      aiSummary,
      aiDevBypass: devBypass,
    };
  }

  async listAuditLogs(query: {
    page?: number;
    limit?: number;
    entityType?: string;
    userId?: string;
  }) {
    const { take, skip } = paginate(query.page, query.limit);
    const where: Prisma.AuditLogWhereInput = {};
    if (query.entityType) where.entityType = query.entityType;
    if (query.userId) where.userId = query.userId;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, meta: paginationMeta(total, query.page ?? 1, take) };
  }
}
