import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  CandidatePipelineStage,
  ClinicalRole,
  PlatformRole,
  Prisma,
} from "@sompacare/database";
import {
  buildWorkerSignupUrl,
  careerPositionToClinicalRole,
  clinicalRoleToPlatformRole,
} from "@sompacare/shared";
import { createClerkClient } from "@clerk/backend";
import { AuditService } from "../../common/audit/audit.service";
import { PrismaService } from "../../common/prisma/prisma.module";
import { NotificationsService } from "../notifications/notifications.service";
import { WorkersService } from "../workers/workers.service";
import { ReferralsService } from "../referrals/referrals.service";
import { CandidateResumeSyncService } from "./candidate-resume-sync.service";
import { IngestCareerApplicationDto } from "./dto/careers.dto";

const candidateInclude = {
  recruiter: { select: { id: true, firstName: true, lastName: true, email: true } },
  facility: { select: { id: true, name: true } },
  worker: { select: { id: true, email: true, firstName: true, lastName: true } },
  interviews: { orderBy: { scheduledAt: "desc" as const } },
} satisfies Prisma.CandidateInclude;

@Injectable()
export class CareersFunnelService {
  private readonly logger = new Logger(CareersFunnelService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private audit: AuditService,
    private workers: WorkersService,
    private notifications: NotificationsService,
    private referrals: ReferralsService,
    private resumeSync: CandidateResumeSyncService
  ) {}

  assertIngestSecret(secret: string | undefined) {
    const expected = this.config.get<string>("CAREERS_INGEST_SECRET");
    if (!expected) {
      throw new BadRequestException("Careers ingest is not configured");
    }
    if (!secret || secret !== expected) {
      throw new UnauthorizedException("Invalid careers ingest secret");
    }
  }

  async ingestFromCareers(dto: IngestCareerApplicationDto) {
    const existing = await this.prisma.candidate.findUnique({
      where: { sourceApplicationId: dto.applicationId },
      include: candidateInclude,
    });
    if (existing) {
      if (dto.resumeUrl && !existing.resumeStorageKey) {
        void this.resumeSync.syncFromSupabase({
          candidateId: existing.id,
          supabasePath: dto.resumeUrl,
          fileName: dto.resumeFileName,
        });
      }
      return { candidate: existing, created: false };
    }

    const recruiterId = await this.resolveDefaultRecruiterId();
    const clinicalRole = careerPositionToClinicalRole(
      dto.position
    ) as ClinicalRole;

    const notes = [
      dto.positionLabel ? `Applied for: ${dto.positionLabel}` : null,
      dto.licenseNumber ? `License: ${dto.licenseNumber} (${dto.licenseState ?? "—"})` : null,
      dto.experience ? `Experience: ${dto.experience}` : null,
      dto.availability ? `Availability: ${dto.availability}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const candidate = await this.prisma.candidate.create({
      data: {
        recruiterId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        clinicalRole,
        source: "careers",
        sourceApplicationId: dto.applicationId,
        resumeUrl: dto.resumeUrl,
        resumeFileName: dto.resumeFileName,
        resumeSourcePath: dto.resumeUrl,
        referralCode: dto.referralCode?.trim().toUpperCase(),
        notes: notes || undefined,
        matchScore: 70,
      },
      include: candidateInclude,
    });

    await this.audit.log({
      userId: recruiterId,
      action: "career.application.ingested",
      entityType: "Candidate",
      entityId: candidate.id,
      changes: { sourceApplicationId: dto.applicationId },
    });

    void this.notifications.notifyUser({
      userId: recruiterId,
      email: undefined,
      title: "New careers applicant",
      body: `${candidate.firstName} ${candidate.lastName} applied via careers (${clinicalRole}).`,
      data: { type: "career.ingested", candidateId: candidate.id },
      sendEmail: false,
    });

    if (dto.referralCode) {
      void this.referrals.recordFromCareers({
        referralCode: dto.referralCode,
        refereeEmail: dto.email,
        candidateId: candidate.id,
      });
    }

    if (dto.resumeUrl) {
      const sync = await this.resumeSync.syncFromSupabase({
        candidateId: candidate.id,
        supabasePath: dto.resumeUrl,
        fileName: dto.resumeFileName,
      });
      if (sync.synced && sync.storageKey) {
        const refreshed = await this.prisma.candidate.findUnique({
          where: { id: candidate.id },
          include: candidateInclude,
        });
        if (refreshed) {
          return { candidate: refreshed, created: true, resumeSynced: true };
        }
      }
    }

    return { candidate, created: true, resumeSynced: false };
  }

  async sendWorkerOnboarding(candidateId: string, recruiterId: string) {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId, recruiterId },
      include: candidateInclude,
    });
    if (!candidate) {
      throw new BadRequestException("Candidate not found");
    }

    const provision = await this.provisionWorkerFromCandidate(candidateId);
    const signupUrl = this.workerSignupUrl(candidate.email);

    const updated = await this.prisma.candidate.update({
      where: { id: candidateId },
      data: { onboardingSentAt: new Date() },
      include: candidateInclude,
    });

    void this.notifications.notifyUser({
      userId: recruiterId,
      email: candidate.email,
      title: "Welcome to Sompacare — complete your worker profile",
      body: `Hi ${candidate.firstName}, your onboarding package is ready. Create your Sompacare worker account to upload credentials, set up payouts, and claim shifts.`,
      data: {
        type: "worker.onboarding_invite",
        candidateId,
        url: signupUrl,
      },
    });

    await this.audit.log({
      userId: recruiterId,
      action: "recruiter.candidate.onboarding_sent",
      entityType: "Candidate",
      entityId: candidateId,
      changes: { workerId: provision.workerId, invited: provision.invited },
    });

    return { candidate: updated, provision, signupUrl };
  }

  async provisionWorkerFromCandidate(candidateId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: candidateInclude,
    });
    if (!candidate) {
      throw new BadRequestException("Candidate not found");
    }

    if (candidate.workerId) {
      return {
        workerId: candidate.workerId,
        linked: true,
        invited: false,
      };
    }

    const email = candidate.email.toLowerCase();
    let user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      include: { roles: { include: { role: true } }, profile: true },
    });

    if (user) {
      await this.assignWorkerRoleAndProfile(user.id, candidate.clinicalRole);
      await this.prisma.candidate.update({
        where: { id: candidate.id },
        data: { workerId: user.id },
      });
      return { workerId: user.id, linked: true, invited: false };
    }

    const invited = await this.sendClerkInvitation(candidate);
    return { workerId: null, linked: false, invited };
  }

  async linkWorkerFromClerkSignup(email: string, userId: string) {
    const normalized = email.toLowerCase();
    const candidate = await this.prisma.candidate.findFirst({
      where: {
        email: { equals: normalized, mode: "insensitive" },
        workerId: null,
        OR: [
          { onboardingSentAt: { not: null } },
          { stage: CandidatePipelineStage.PLACED },
          { offerAcceptedAt: { not: null } },
        ],
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!candidate) return { linked: false };

    await this.assignWorkerRoleAndProfile(userId, candidate.clinicalRole);
    await this.prisma.candidate.update({
      where: { id: candidate.id },
      data: { workerId: userId },
    });

    await this.audit.log({
      userId,
      action: "career.worker.linked_from_signup",
      entityType: "Candidate",
      entityId: candidate.id,
      changes: { workerId: userId },
    });

    void this.referrals.linkReferee(userId, email);

    return { linked: true, candidateId: candidate.id };
  }

  private async assignWorkerRoleAndProfile(userId: string, clinicalRole: ClinicalRole) {
    const platformRoleName = clinicalRoleToPlatformRole(clinicalRole);

    const role = await this.prisma.role.findUnique({
      where: { name: platformRoleName as PlatformRole },
    });
    if (!role) {
      throw new BadRequestException(`Worker role ${platformRoleName} is not configured`);
    }

    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: { userId, roleId: role.id },
    });

    await this.workers.ensureWorkerProfile(userId);

    await this.prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0 },
    });
  }

  private async sendClerkInvitation(
    candidate: Prisma.CandidateGetPayload<{ include: typeof candidateInclude }>
  ) {
    const secretKey = this.config.get<string>("CLERK_SECRET_KEY");
    if (!secretKey) {
      this.logger.warn("CLERK_SECRET_KEY missing — skipping Clerk invitation");
      return false;
    }

    try {
      const clerk = createClerkClient({ secretKey });
      await clerk.invitations.createInvitation({
        emailAddress: candidate.email,
        redirectUrl: this.workerSignupUrl(candidate.email),
        publicMetadata: {
          sompacare_candidate_id: candidate.id,
          clinical_role: candidate.clinicalRole,
        },
      });
      return true;
    } catch (error) {
      this.logger.warn(
        `Clerk invitation failed for ${candidate.email}: ${(error as Error).message}`
      );
      return false;
    }
  }

  private workerSignupUrl(email: string) {
    const nursePortalUrl =
      this.config.get<string>("NURSE_PORTAL_URL") ?? "http://localhost:3001";
    return buildWorkerSignupUrl(nursePortalUrl, email);
  }

  private async resolveDefaultRecruiterId() {
    const recruiterRole = await this.prisma.role.findUnique({
      where: { name: PlatformRole.RECRUITER },
    });
    if (!recruiterRole) {
      throw new BadRequestException("Recruiter role is not configured");
    }

    const assignment = await this.prisma.userRole.findFirst({
      where: { roleId: recruiterRole.id },
      include: { user: true },
      orderBy: { grantedAt: "asc" },
    });

    if (!assignment?.user) {
      throw new BadRequestException("No recruiter is available to receive applications");
    }

    return assignment.user.id;
  }
}
