import { Injectable, NotFoundException } from "@nestjs/common";
import {
  assessComplianceRisks,
  calculateShiftMatch,
  detectPayrollAnomalies,
  type MatchResult,
} from "@sompacare/shared";
import { Prisma } from "@sompacare/database";
import { PrismaService } from "../../common/prisma/prisma.module";
import { ComplianceService } from "../compliance/compliance.service";
import { OpenAiService } from "./openai.service";

type WorkerWithProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  profile: {
    clinicalRole: string;
    complianceScore: number;
    reliabilityScore: number;
    specialties: string[];
    minHourlyRate: Prisma.Decimal | null;
    preferredShiftTypes: string[];
    preferredLocations: string[];
  } | null;
};

@Injectable()
export class MatchingService {
  constructor(
    private prisma: PrismaService,
    private compliance: ComplianceService,
    private openai: OpenAiService
  ) {}

  private async isAiMatchingEnabled(): Promise<boolean> {
    const flag = await this.prisma.featureFlag.findUnique({ where: { key: "ai_matching" } });
    return flag?.isEnabled ?? true;
  }

  private toWorkerInput(profile: NonNullable<WorkerWithProfile["profile"]>) {
    return {
      clinicalRole: profile.clinicalRole,
      complianceScore: profile.complianceScore,
      reliabilityScore: profile.reliabilityScore,
      specialties: profile.specialties,
      minHourlyRate: profile.minHourlyRate ? Number(profile.minHourlyRate) : null,
      preferredShiftTypes: profile.preferredShiftTypes,
      preferredLocations: profile.preferredLocations,
    };
  }

  scoreWorkerForShift(
    shift: {
      role: string;
      hourlyRate: Prisma.Decimal;
      shiftType: string;
      requirements: string[];
      location: { city: string; state: string };
    },
    worker: WorkerWithProfile
  ): MatchResult | null {
    if (!worker.profile) return null;
    if (worker.profile.clinicalRole !== shift.role && worker.profile.clinicalRole !== "NURSE") {
      return null;
    }

    return calculateShiftMatch(
      {
        role: shift.role,
        hourlyRate: Number(shift.hourlyRate),
        shiftType: shift.shiftType,
        requirements: shift.requirements,
        location: shift.location,
      },
      this.toWorkerInput(worker.profile)
    );
  }

  async getShiftMatches(shiftId: string, limit = 20) {
    const aiEnabled = await this.isAiMatchingEnabled();
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: { location: { select: { city: true, state: true } } },
    });
    if (!shift) throw new NotFoundException("Shift not found");

    const workers = await this.prisma.user.findMany({
      where: {
        profile: { clinicalRole: shift.role },
        status: "ACTIVE",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        profile: {
          select: {
            clinicalRole: true,
            complianceScore: true,
            reliabilityScore: true,
            specialties: true,
            minHourlyRate: true,
            preferredShiftTypes: true,
            preferredLocations: true,
          },
        },
      },
      take: 100,
    });

    const ranked = (
      await Promise.all(
        workers.map(async (worker) => {
          const match = this.scoreWorkerForShift(shift, worker);
          if (!match || match.score < 40) return null;

          const evaluation = await this.compliance.evaluateWorker(worker.id, [shift.role]);
          if (!evaluation.isCompliant) return null;

          const summary = aiEnabled
            ? await this.openai.enhanceMatchSummary({
                shiftTitle: shift.title,
                workerName: `${worker.firstName} ${worker.lastName}`,
                score: match.score,
                highlights: match.highlights,
              })
            : {
                devBypass: true,
                summary: match.highlights.slice(0, 2).join(", ") || `Match score: ${match.score}%`,
              };

          await this.prisma.shiftMatchScore.upsert({
            where: { shiftId_workerId: { shiftId, workerId: worker.id } },
            update: { score: match.score, factors: match.factors as Prisma.InputJsonValue },
            create: {
              shiftId,
              workerId: worker.id,
              score: match.score,
              factors: match.factors as Prisma.InputJsonValue,
            },
          });

          return {
            worker: {
              id: worker.id,
              firstName: worker.firstName,
              lastName: worker.lastName,
              email: worker.email,
              avatarUrl: worker.avatarUrl,
              profile: worker.profile,
            },
            score: match.score,
            factors: match.factors,
            highlights: match.highlights,
            summary: summary.summary,
            devBypass: summary.devBypass,
          };
        })
      )
    )
      .filter(Boolean)
      .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))
      .slice(0, limit);

    return {
      shiftId,
      total: ranked.length,
      aiEnabled,
      devBypass: this.openai.isDevBypass(),
      matches: ranked,
    };
  }

  async getRecommendedShifts(workerId: string, limit = 20) {
    const aiEnabled = await this.isAiMatchingEnabled();
    const worker = await this.prisma.user.findUnique({
      where: { id: workerId },
      include: {
        profile: true,
      },
    });
    if (!worker?.profile) throw new NotFoundException("Worker profile not found");

    const shifts = await this.prisma.shift.findMany({
      where: { status: "PUBLISHED", role: worker.profile.clinicalRole },
      include: {
        facility: { select: { id: true, name: true, rating: true } },
        location: { select: { id: true, city: true, state: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { startTime: "asc" },
      take: 50,
    });

    const ranked = aiEnabled
      ? shifts
          .map((shift) => {
            const match = calculateShiftMatch(
              {
                role: shift.role,
                hourlyRate: Number(shift.hourlyRate),
                shiftType: shift.shiftType,
                requirements: shift.requirements,
                location: shift.location,
              },
              this.toWorkerInput(worker.profile!)
            );
            return { shift, ...match };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
      : shifts.slice(0, limit).map((shift) => ({
          shift,
          score: 0,
          factors: {},
          highlights: [] as string[],
        }));

    return {
      workerId,
      total: ranked.length,
      aiEnabled,
      devBypass: this.openai.isDevBypass(),
      recommendations: ranked.map((r) => ({
        shift: r.shift,
        score: r.score,
        factors: r.factors,
        highlights: r.highlights,
      })),
    };
  }

  async scoreApplication(shiftId: string, workerId: string) {
    const aiEnabled = await this.isAiMatchingEnabled();
    if (!aiEnabled) return 0;

    const [shift, worker] = await Promise.all([
      this.prisma.shift.findUnique({
        where: { id: shiftId },
        include: { location: { select: { city: true, state: true } } },
      }),
      this.prisma.user.findUnique({
        where: { id: workerId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
          profile: {
            select: {
              clinicalRole: true,
              complianceScore: true,
              reliabilityScore: true,
              specialties: true,
              minHourlyRate: true,
              preferredShiftTypes: true,
              preferredLocations: true,
            },
          },
        },
      }),
    ]);

    if (!shift || !worker) return 0;
    const match = this.scoreWorkerForShift(shift, worker);
    return match?.score ?? 0;
  }

  async scanPayrollAnomalies(facilityId?: string) {
    const timecards = await this.prisma.timecard.findMany({
      where: {
        status: { in: ["SUBMITTED", "APPROVED", "DRAFT"] },
        ...(facilityId
          ? { assignment: { shift: { facilityId } } }
          : {}),
      },
      include: {
        worker: { select: { id: true, firstName: true, lastName: true } },
        assignment: {
          include: {
            shift: { select: { endTime: true, startTime: true } },
            clockEvents: { select: { type: true } },
          },
        },
      },
      take: 100,
      orderBy: { updatedAt: "desc" },
    });

    const inputs = timecards.map((tc) => {
      const scheduledMs =
        tc.assignment.shift.endTime.getTime() - tc.assignment.shift.startTime.getTime();
      const scheduledHours = scheduledMs / 3600000;
      const hasClockOut = tc.assignment.clockEvents.some((e) => e.type === "CLOCK_OUT");

      return {
        id: tc.id,
        workerId: tc.workerId,
        workerName: `${tc.worker.firstName} ${tc.worker.lastName}`,
        regularHours: Number(tc.regularHours),
        overtimeHours: Number(tc.overtimeHours),
        breakMinutes: tc.breakMinutes,
        scheduledHours,
        hasClockOut,
        shiftEndTime: tc.assignment.shift.endTime.toISOString(),
      };
    });

    const anomalies = detectPayrollAnomalies(inputs);
    return { total: anomalies.length, devBypass: this.openai.isDevBypass(), anomalies };
  }

  async assessComplianceRisks(userId: string) {
    const evaluation = await this.compliance.evaluateWorker(userId);
    const [licenses, certifications, bg] = await Promise.all([
      this.prisma.license.findMany({ where: { userId } }),
      this.prisma.certification.findMany({ where: { userId } }),
      this.prisma.backgroundCheck.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const risks = assessComplianceRisks({
      score: evaluation.score,
      isCompliant: evaluation.isCompliant,
      blockedReasons: evaluation.blockedReasons,
      licenses: licenses.map((l) => ({
        id: l.id,
        type: l.type,
        status: l.status,
        expiresAt: l.expiresAt.toISOString(),
      })),
      certifications: certifications.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        expiresAt: c.expiresAt?.toISOString() ?? null,
      })),
      backgroundCheckStatus: bg?.status ?? null,
    });

    return {
      userId,
      score: evaluation.score,
      isCompliant: evaluation.isCompliant,
      total: risks.length,
      devBypass: this.openai.isDevBypass(),
      risks,
    };
  }
}
