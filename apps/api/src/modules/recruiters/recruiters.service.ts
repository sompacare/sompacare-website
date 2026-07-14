import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import {
  CandidatePipelineStage,
  ClinicalRole,
  Prisma,
} from "@sompacare/database";
import { AuditService } from "../../common/audit/audit.service";
import { paginate, paginationMeta } from "../../common/decorators";
import { PrismaService } from "../../common/prisma/prisma.module";
import { NotificationsService } from "../notifications/notifications.service";
import {
  CreateCandidateDto,
  ScheduleInterviewDto,
  SendOfferDto,
  UpdateCandidateStageDto,
  UpdateChecklistDto,
} from "./dto/recruiters.dto";
import { ResumeParserService } from "./resume-parser.service";
import { CareersFunnelService } from "../careers/careers-funnel.service";
import { CandidateResumeSyncService } from "../careers/candidate-resume-sync.service";
import { ComplianceService } from "../compliance/compliance.service";

const STAGE_ORDER: CandidatePipelineStage[] = [
  CandidatePipelineStage.APPLIED,
  CandidatePipelineStage.SCREENING,
  CandidatePipelineStage.INTERVIEW,
  CandidatePipelineStage.OFFER,
  CandidatePipelineStage.PLACED,
  CandidatePipelineStage.HIRED,
];

const candidateInclude = {
  recruiter: { select: { id: true, firstName: true, lastName: true, email: true } },
  facility: { select: { id: true, name: true } },
  worker: { select: { id: true, email: true, firstName: true, lastName: true } },
  interviews: { orderBy: { scheduledAt: "desc" as const } },
} satisfies Prisma.CandidateInclude;

@Injectable()
export class RecruitersService {
  private readonly logger = new Logger(RecruitersService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
    private resumeParser: ResumeParserService,
    private careerFunnel: CareersFunnelService,
    private resumeSync: CandidateResumeSyncService,
    private compliance: ComplianceService
  ) {}

  async getPipeline(recruiterId: string) {
    const candidates = await this.prisma.candidate.findMany({
      where: {
        recruiterId,
        stage: { not: CandidatePipelineStage.REJECTED },
      },
      include: candidateInclude,
      orderBy: { updatedAt: "desc" },
    });

    const columns = STAGE_ORDER.map((stage) => ({
      stage,
      count: candidates.filter((c) => c.stage === stage).length,
      candidates: candidates.filter((c) => c.stage === stage),
    }));

    return { columns, total: candidates.length };
  }

  async findAll(recruiterId: string, stage?: CandidatePipelineStage, page = 1, limit = 20) {
    const { take, skip } = paginate(page, limit);
    const where: Prisma.CandidateWhereInput = { recruiterId };
    if (stage) where.stage = stage;

    const [data, total] = await Promise.all([
      this.prisma.candidate.findMany({
        where,
        include: candidateInclude,
        orderBy: { updatedAt: "desc" },
        take,
        skip,
      }),
      this.prisma.candidate.count({ where }),
    ]);

    return { data, meta: paginationMeta(total, page, take) };
  }

  async findOne(id: string, recruiterId: string) {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id, recruiterId },
      include: candidateInclude,
    });
    if (!candidate) throw new NotFoundException("Candidate not found");
    return candidate;
  }

  async create(dto: CreateCandidateDto, recruiterId: string) {
    const candidate = await this.prisma.candidate.create({
      data: {
        recruiterId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        clinicalRole: dto.clinicalRole,
        source: dto.source,
        resumeUrl: dto.resumeUrl,
        notes: dto.notes,
        facilityId: dto.facilityId,
        matchScore: 75,
      },
      include: candidateInclude,
    });

    await this.audit.log({
      userId: recruiterId,
      action: "recruiter.candidate.created",
      entityType: "Candidate",
      entityId: candidate.id,
    });

    return candidate;
  }

  async updateStage(id: string, recruiterId: string, dto: UpdateCandidateStageDto) {
    const existing = await this.findOne(id, recruiterId);

    if (dto.stage === CandidatePipelineStage.PLACED) {
      const placed = await this.careerFunnel.placeCandidate(id, recruiterId);
      await this.audit.log({
        userId: recruiterId,
        action: "recruiter.candidate.stage_changed",
        entityType: "Candidate",
        entityId: id,
        changes: { from: existing.stage, to: dto.stage, offerSent: placed.offerSent },
      });
      return placed.candidate;
    }

    if (dto.stage === CandidatePipelineStage.HIRED) {
      const hire = await this.careerFunnel.hireCandidate(id, recruiterId);
      await this.audit.log({
        userId: recruiterId,
        action: "recruiter.candidate.stage_changed",
        entityType: "Candidate",
        entityId: id,
        changes: { from: existing.stage, to: dto.stage, employeeNumber: hire.employeeNumber },
      });
      return hire.candidate;
    }

    const updated = await this.prisma.candidate.update({
      where: { id },
      data: {
        stage: dto.stage,
        notes: dto.notes ?? existing.notes,
      },
      include: candidateInclude,
    });

    await this.audit.log({
      userId: recruiterId,
      action: "recruiter.candidate.stage_changed",
      entityType: "Candidate",
      entityId: id,
      changes: { from: existing.stage, to: dto.stage },
    });

    return updated;
  }

  async scheduleInterview(
    id: string,
    recruiterId: string,
    dto: ScheduleInterviewDto
  ) {
    const candidate = await this.findOne(id, recruiterId);

    const interview = await this.prisma.candidateInterview.create({
      data: {
        candidateId: id,
        scheduledAt: new Date(dto.scheduledAt),
        mode: dto.mode ?? "video",
        notes: dto.notes,
      },
    });

    let updated = candidate;
    if (candidate.stage === CandidatePipelineStage.APPLIED) {
      updated = await this.prisma.candidate.update({
        where: { id },
        data: { stage: CandidatePipelineStage.SCREENING },
        include: candidateInclude,
      });
    } else if (candidate.stage === CandidatePipelineStage.SCREENING) {
      updated = await this.prisma.candidate.update({
        where: { id },
        data: { stage: CandidatePipelineStage.INTERVIEW },
        include: candidateInclude,
      });
    }

    void this.notifications.notifyInterviewScheduled(
      recruiterId,
      candidate.email,
      `${candidate.firstName} ${candidate.lastName}`,
      dto.scheduledAt,
      id
    );

    return { candidate: updated, interview };
  }

  async sendOffer(id: string, recruiterId: string, dto: SendOfferDto) {
    const candidate = await this.findOne(id, recruiterId);

    const updated = await this.prisma.candidate.update({
      where: { id },
      data: {
        stage: CandidatePipelineStage.OFFER,
        offerSentAt: new Date(),
        facilityId: dto.facilityId ?? candidate.facilityId,
        hireDetails: {
          payRate: dto.payRate,
          startDate: dto.startDate,
          sentAt: new Date().toISOString(),
        },
      },
      include: candidateInclude,
    });

    void this.notifications.notifyOfferSent(
      recruiterId,
      candidate.email,
      `${candidate.firstName} ${candidate.lastName}`,
      id
    );

    await this.audit.log({
      userId: recruiterId,
      action: "recruiter.candidate.offer_sent",
      entityType: "Candidate",
      entityId: id,
    });

    return updated;
  }

  async acceptOffer(id: string, recruiterId: string) {
    const candidate = await this.findOne(id, recruiterId);
    if (candidate.stage !== CandidatePipelineStage.OFFER) {
      throw new BadRequestException("Candidate must be in OFFER stage");
    }

    const updated = await this.prisma.candidate.update({
      where: { id },
      data: { offerAcceptedAt: new Date() },
      include: candidateInclude,
    });

    return updated;
  }

  async sendOnboarding(id: string, recruiterId: string) {
    return this.careerFunnel.sendOnboardingPackage(id, recruiterId);
  }

  async getResumeDownload(id: string, recruiterId: string) {
    const result = await this.resumeSync.getResumeDownload(id, recruiterId);
    if (!result) throw new NotFoundException("Resume not available");
    return result;
  }

  async parseResume(id: string, recruiterId: string, resumeText?: string) {
    const candidate = await this.findOne(id, recruiterId);
    const { parsed, devBypass } = await this.resumeParser.parseResume({
      resumeText,
      resumeUrl: candidate.resumeUrl ?? undefined,
      clinicalRole: candidate.clinicalRole,
    });

    const matchScore = Math.min(
      100,
      60 +
        (parsed.yearsExperience ?? 0) * 5 +
        (parsed.certifications?.length ?? 0) * 3
    );

    const updated = await this.prisma.candidate.update({
      where: { id },
      data: {
        resumeParsedAt: new Date(),
        resumeParsedData: parsed as Prisma.InputJsonValue,
        matchScore,
        clinicalRole: (parsed.clinicalRole as ClinicalRole) ?? candidate.clinicalRole,
      },
      include: candidateInclude,
    });

    return { candidate: updated, parsed, devBypass };
  }

  async updateChecklist(id: string, recruiterId: string, dto: UpdateChecklistDto) {
    const candidate = await this.findOne(id, recruiterId);
    const updated = await this.prisma.candidate.update({
      where: { id },
      data: {
        backgroundCheckStatus: dto.backgroundCheckStatus,
        referenceStatus: dto.referenceStatus,
      },
      include: candidateInclude,
    });

    if (dto.backgroundCheckStatus === "cleared" && updated.workerId) {
      await this.compliance.markHrBackgroundCleared(updated.workerId);
    }

    return updated;
  }

  async getMetrics(recruiterId: string) {
    const [byStage, placed, hired, recent] = await Promise.all([
      this.prisma.candidate.groupBy({
        by: ["stage"],
        where: { recruiterId },
        _count: true,
      }),
      this.prisma.candidate.count({
        where: { recruiterId, stage: CandidatePipelineStage.PLACED },
      }),
      this.prisma.candidate.count({
        where: { recruiterId, stage: CandidatePipelineStage.HIRED },
      }),
      this.prisma.candidate.findMany({
        where: { recruiterId, stage: CandidatePipelineStage.HIRED },
        orderBy: { hiredAt: "desc" },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          clinicalRole: true,
          hiredAt: true,
          facility: { select: { name: true } },
        },
      }),
    ]);

    const active = byStage
      .filter(
        (s) =>
          s.stage !== CandidatePipelineStage.PLACED &&
          s.stage !== CandidatePipelineStage.HIRED &&
          s.stage !== CandidatePipelineStage.REJECTED
      )
      .reduce((sum, s) => sum + s._count, 0);

    return {
      activePipeline: active,
      placedTotal: placed,
      hiredTotal: hired,
      byStage: Object.fromEntries(byStage.map((s) => [s.stage, s._count])),
      recentPlacements: recent,
    };
  }

  async getLeaderboard() {
    const recruiters = await this.prisma.candidate.groupBy({
      by: ["recruiterId"],
      where: { stage: CandidatePipelineStage.PLACED },
      _count: true,
      orderBy: { _count: { recruiterId: "desc" } },
      take: 10,
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: recruiters.map((r) => r.recruiterId) } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return recruiters.map((r, index) => ({
      rank: index + 1,
      recruiter: userMap.get(r.recruiterId),
      placements: r._count,
    }));
  }
}
