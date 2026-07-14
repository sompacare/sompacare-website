import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CandidatePipelineStage, ClinicalRole, PlatformRole, Prisma, UserStatus } from "@sompacare/database";
import {
  buildWorkerSignupUrl,
  careerPositionToClinicalRole,
  clinicalRoleToPlatformRole,
  buildEmployeeNumber,
  normalizeEmployeeNumber,
  ADMIN_ROLES,
  FACILITY_ROLES,
  PlatformRole as SharedPlatformRole,
  SOMPACARE_BRAND,
  WORKER_ROLES,
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
    return this.sendOnboardingPackage(candidateId, recruiterId);
  }

  async placeByApplicationId(applicationId: string) {
    const candidate = await this.prisma.candidate.findFirst({
      where: { sourceApplicationId: applicationId },
      include: candidateInclude,
    });
    if (!candidate) {
      throw new BadRequestException(
        "No platform candidate found for this application. The applicant may not have been ingested from the careers page yet."
      );
    }

    const actorUserId = candidate.recruiterId ?? (await this.resolveDefaultRecruiterId());
    return this.placeCandidate(candidate.id, actorUserId);
  }

  async hireByApplicationId(applicationId: string) {
    const candidate = await this.prisma.candidate.findFirst({
      where: { sourceApplicationId: applicationId },
      include: candidateInclude,
    });
    if (!candidate) {
      throw new BadRequestException(
        "No platform candidate found for this application. The applicant may not have been ingested from the careers page yet."
      );
    }

    const actorUserId = candidate.recruiterId ?? (await this.resolveDefaultRecruiterId());
    return this.hireCandidate(candidate.id, actorUserId);
  }

  async sendOnboardingPackage(candidateId: string, actorUserId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: candidateInclude,
    });
    if (!candidate) {
      throw new BadRequestException("Candidate not found");
    }

    await this.notifications.notifyCandidateOnboardingPackage(
      actorUserId,
      candidate.email,
      candidate.firstName,
      candidateId
    );

    const updated = await this.prisma.candidate.update({
      where: { id: candidateId },
      data: { onboardingSentAt: new Date() },
      include: candidateInclude,
    });

    return { candidate: updated };
  }

  async placeCandidate(candidateId: string, actorUserId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: candidateInclude,
    });
    if (!candidate) {
      throw new BadRequestException("Candidate not found");
    }

    const hireDetails = (candidate.hireDetails as { payRate?: string; startDate?: string } | null) ?? {};
    let offerSent = Boolean(candidate.offerSentAt);

    if (!offerSent) {
      await this.prisma.candidate.update({
        where: { id: candidateId },
        data: {
          stage: CandidatePipelineStage.OFFER,
          offerSentAt: new Date(),
          hireDetails: {
            payRate: hireDetails.payRate ?? "Per facility agreement",
            startDate: hireDetails.startDate ?? null,
            sentAt: new Date().toISOString(),
          },
        },
      });
      await this.notifications.notifyCandidateOfferLetter(
        actorUserId,
        candidate.email,
        candidate.firstName,
        candidate.clinicalRole,
        hireDetails.payRate ?? "Per facility agreement",
        hireDetails.startDate,
        candidateId
      );
      offerSent = true;
    }

    await this.sendOnboardingPackage(candidateId, actorUserId);

    const updated = await this.prisma.candidate.update({
      where: { id: candidateId },
      data: {
        stage: CandidatePipelineStage.PLACED,
        placedAt: candidate.placedAt ?? new Date(),
      },
      include: candidateInclude,
    });

    await this.audit.log({
      userId: actorUserId,
      action: "candidate.placed",
      entityType: "Candidate",
      entityId: candidateId,
      changes: { offerSent, onboardingSent: true },
    });

    return { candidate: updated, offerSent, onboardingSent: true };
  }

  async hireCandidate(candidateId: string, actorUserId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: candidateInclude,
    });
    if (!candidate) {
      throw new BadRequestException("Candidate not found");
    }

    if (
      candidate.stage !== CandidatePipelineStage.PLACED &&
      candidate.stage !== CandidatePipelineStage.HIRED
    ) {
      await this.placeCandidate(candidateId, actorUserId);
    }

    const refreshed = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: candidateInclude,
    });
    if (!refreshed) {
      throw new BadRequestException("Candidate not found");
    }

    if (refreshed.workerId) {
      await this.assertUserActive(refreshed.workerId);
    } else {
      const existingUser = await this.prisma.user.findFirst({
        where: { email: { equals: refreshed.email, mode: "insensitive" } },
        select: { id: true, status: true },
      });
      if (existingUser) {
        await this.assertUserActive(existingUser.id);
      }
    }

    const employeeNumber = await this.ensureCandidateEmployeeNumber(candidateId);
    const provision = await this.provisionWorkerFromCandidate(candidateId);
    const signupUrl = this.workerSignupUrl(refreshed.email, employeeNumber);
    const nursePortalUrl =
      this.config.get<string>("NURSE_PORTAL_URL") ?? "http://localhost:3001";
    const signInUrl = `${nursePortalUrl.replace(/\/$/, "")}/sign-in`;

    const updated = await this.prisma.candidate.update({
      where: { id: candidateId },
      data: {
        stage: CandidatePipelineStage.HIRED,
        hiredAt: new Date(),
      },
      include: candidateInclude,
    });

    void this.notifications.notifyUser({
      userId: actorUserId,
      email: refreshed.email,
      title: "You're hired — create your Sompacare portal account",
      body: `Hi ${refreshed.firstName}, congratulations! Your Sompacare employee number is ${employeeNumber}. Sign up at the nurse portal using this number and ${refreshed.email}, then create your password. After your first sign-up, you can sign in anytime with just your email and password.`,
      data: {
        type: "worker.hired",
        candidateId,
        employeeNumber,
        url: signupUrl,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: "candidate.hired",
      entityType: "Candidate",
      entityId: candidateId,
      changes: {
        employeeNumber,
        workerId: provision.workerId,
        invited: provision.invited,
        signupUrl,
        signInUrl,
      },
    });

    return { candidate: updated, provision, signupUrl, signInUrl, employeeNumber };
  }

  async verifyEmployeeAccess(email: string, employeeNumber: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedNumber = normalizeEmployeeNumber(employeeNumber);

    const linkedUser = await this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      select: { id: true, status: true },
    });
    if (linkedUser) {
      await this.assertUserActive(linkedUser.id);
    }

    const candidate = await this.prisma.candidate.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: "insensitive" },
        employeeNumber: normalizedNumber,
        OR: [
          { stage: CandidatePipelineStage.HIRED },
          { employeeNumber: { not: null } },
        ],
      },
    });

    if (!candidate) {
      throw new BadRequestException(
        `Employee number and email do not match our records. Apply at ${SOMPACARE_BRAND.careersUrl} and wait for HR to send your employee number.`
      );
    }

    if (candidate.workerId) {
      await this.assertUserActive(candidate.workerId);
    }

    return {
      email: candidate.email,
      employeeNumber: normalizedNumber,
      candidateId: candidate.id,
    };
  }

  async ensureWorkerAccess(userId: string, email: string, employeeNumber?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException("User not found");

    await this.assertUserActive(userId);

    const workerRole = user.roles.find((entry) =>
      WORKER_ROLES.includes(entry.role.name as (typeof WORKER_ROLES)[number])
    );
    if (workerRole) {
      await this.workers.ensureWorkerProfile(userId).catch(() => undefined);
      await this.prisma.wallet.upsert({
        where: { userId },
        update: {},
        create: { userId, balance: 0 },
      });
      return {
        ready: true,
        role: workerRole.role.name,
        linkedFromCandidate: false,
        employeeNumber: user.employeeNumber ?? undefined,
      };
    }

    const portalOnlyRoles = [...FACILITY_ROLES, ...ADMIN_ROLES, SharedPlatformRole.RECRUITER];
    if (
      user.roles.some((entry) =>
        portalOnlyRoles.includes(entry.role.name as SharedPlatformRole)
      )
    ) {
      throw new ForbiddenException(
        "This account is not set up as a worker. Sign in through the nurse portal with a worker account."
      );
    }

    if (user.employeeNumber) {
      const linkedCandidate = await this.prisma.candidate.findFirst({
        where: {
          workerId: userId,
          email: { equals: email.trim().toLowerCase(), mode: "insensitive" },
        },
      });
      if (linkedCandidate) {
        await this.assignWorkerRoleAndProfile(userId, linkedCandidate.clinicalRole);
        await this.prisma.wallet.upsert({
          where: { userId },
          update: {},
          create: { userId, balance: 0 },
        });
        return {
          ready: true,
          role: clinicalRoleToPlatformRole(linkedCandidate.clinicalRole),
          linkedFromCandidate: true,
          employeeNumber: user.employeeNumber,
        };
      }
    }

    const normalizedNumber = employeeNumber
      ? normalizeEmployeeNumber(employeeNumber)
      : user.employeeNumber
        ? normalizeEmployeeNumber(user.employeeNumber)
        : null;

    if (!normalizedNumber) {
      throw new ForbiddenException(
        `Your Sompacare employee number is required for first-time sign-up. Apply at ${SOMPACARE_BRAND.careersUrl} — HR will email your number when you are hired.`
      );
    }

    if (user.employeeNumber && user.employeeNumber !== normalizedNumber) {
      throw new ForbiddenException("Employee number does not match this account.");
    }

    const verified = await this.verifyEmployeeAccess(email, normalizedNumber);
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: verified.candidateId },
    });
    if (!candidate) {
      throw new BadRequestException("Candidate record not found");
    }

    await this.assignWorkerRoleAndProfile(userId, candidate.clinicalRole);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { employeeNumber: normalizedNumber },
      }),
      this.prisma.candidate.update({
        where: { id: candidate.id },
        data: { workerId: userId },
      }),
    ]);

    return {
      ready: true,
      role: clinicalRoleToPlatformRole(candidate.clinicalRole),
      linkedFromCandidate: true,
      employeeNumber: normalizedNumber,
    };
  }

  private async assertUserActive(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });
    if (!user) return;
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException(
        "Your Sompacare access has been terminated. Contact HR if you believe this is an error."
      );
    }
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

    const candidateEmail = candidate.email.toLowerCase();
    let user = await this.prisma.user.findFirst({
      where: { email: { equals: candidateEmail, mode: "insensitive" } },
      include: { roles: { include: { role: true } }, profile: true },
    });

    if (user) {
      await this.assignWorkerRoleAndProfile(user.id, candidate.clinicalRole);
      const employeeNumber =
        candidate.employeeNumber ?? (await this.ensureCandidateEmployeeNumber(candidateId));
      await this.prisma.$transaction([
        this.prisma.candidate.update({
          where: { id: candidate.id },
          data: { workerId: user.id },
        }),
        this.prisma.user.update({
          where: { id: user.id },
          data: { employeeNumber },
        }),
      ]);
      return { workerId: user.id, linked: true, invited: false, employeeNumber };
    }

    const employeeNumber = await this.ensureCandidateEmployeeNumber(candidateId);
    const invited = await this.sendClerkInvitation(candidate, employeeNumber);
    return { workerId: null, linked: false, invited, employeeNumber };
  }

  async linkWorkerFromClerkSignup(email: string, userId: string) {
    const normalized = email.toLowerCase();
    const candidate = await this.prisma.candidate.findFirst({
      where: {
        email: { equals: normalized, mode: "insensitive" },
        workerId: null,
        OR: [
          { stage: CandidatePipelineStage.HIRED },
          { employeeNumber: { not: null } },
          { offerAcceptedAt: { not: null } },
        ],
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!candidate) return { linked: false };

    await this.assignWorkerRoleAndProfile(userId, candidate.clinicalRole);
    const employeeNumber =
      candidate.employeeNumber ?? (await this.ensureCandidateEmployeeNumber(candidate.id));
    await this.prisma.$transaction([
      this.prisma.candidate.update({
        where: { id: candidate.id },
        data: { workerId: userId },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { employeeNumber },
      }),
    ]);

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

  async ensureCandidateEmployeeNumberPublic(candidateId: string) {
    return this.ensureCandidateEmployeeNumber(candidateId);
  }

  private async ensureCandidateEmployeeNumber(candidateId: string) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) {
      throw new BadRequestException("Candidate not found");
    }
    if (candidate.employeeNumber) {
      return candidate.employeeNumber;
    }

    let employeeNumber = buildEmployeeNumber(candidate.id);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const collision = await this.prisma.candidate.findFirst({
        where: { employeeNumber },
        select: { id: true },
      });
      if (!collision) break;
      employeeNumber = buildEmployeeNumber(`${candidate.id}-${attempt}`);
    }

    const updated = await this.prisma.candidate.update({
      where: { id: candidateId },
      data: { employeeNumber },
    });
    return updated.employeeNumber!;
  }

  private async assignWorkerRoleAndProfile(userId: string, clinicalRole: ClinicalRole) {
    const platformRoleName = clinicalRoleToPlatformRole(clinicalRole);

    const role = await this.prisma.role.upsert({
      where: { name: platformRoleName as PlatformRole },
      update: {},
      create: {
        name: platformRoleName as PlatformRole,
        displayName: platformRoleName.replace(/_/g, " "),
        description: `${platformRoleName} platform role`,
      },
    });

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
    candidate: Prisma.CandidateGetPayload<{ include: typeof candidateInclude }>,
    employeeNumber: string
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
        redirectUrl: this.workerSignupUrl(candidate.email, employeeNumber),
        publicMetadata: {
          sompacare_candidate_id: candidate.id,
          clinical_role: candidate.clinicalRole,
          employee_number: employeeNumber,
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

  private workerSignupUrl(email: string, employeeNumber?: string) {
    const nursePortalUrl =
      this.config.get<string>("NURSE_PORTAL_URL") ?? "http://localhost:3001";
    return buildWorkerSignupUrl(nursePortalUrl, email, employeeNumber);
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
