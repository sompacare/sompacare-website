import {
  BadRequestException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CandidatePipelineStage, ClinicalRole, PlatformRole as DbPlatformRole } from "@sompacare/database";
import { PlatformRole } from "@sompacare/shared";
import { PrismaService } from "../../common/prisma/prisma.module";
import { CareersFunnelService } from "../careers/careers-funnel.service";
import type { CreateWorkerEmployeeDto, QuickInviteWorkerDto } from "./dto/worker-onboarding.dto";

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function namesFromEmail(email: string) {
  const local = email.split("@")[0] ?? "employee";
  const parts = local.replace(/[+._-]/g, " ").split(/\s+/).filter(Boolean);
  const firstName = parts[0] ? capitalize(parts[0]) : "Employee";
  const lastName = parts.slice(1).map(capitalize).join(" ") || "Pending";
  return { firstName, lastName };
}

@Injectable()
export class WorkerOnboardingService {
  private readonly logger = new Logger(WorkerOnboardingService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private careersFunnel: CareersFunnelService
  ) {}

  async quickInvite(actorUserId: string, dto: QuickInviteWorkerDto, source: "admin" | "recruiter") {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const clinicalRole = dto.clinicalRole ?? ClinicalRole.RN;
    const { firstName, lastName } = namesFromEmail(normalizedEmail);

    const candidateId = await this.ensureCandidateRecord({
      actorUserId,
      email: normalizedEmail,
      firstName,
      lastName,
      clinicalRole,
      source: `${source}_quick_invite`,
    });

    return this.hireAndRespond(candidateId, actorUserId);
  }

  async createEmployee(actorUserId: string, dto: CreateWorkerEmployeeDto, source: "admin" | "recruiter") {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const notes = [
      dto.notes?.trim(),
      dto.licenseNumber
        ? `License: ${dto.licenseNumber}${dto.licenseState ? ` (${dto.licenseState})` : ""}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const candidateId = await this.ensureCandidateRecord({
      actorUserId,
      email: normalizedEmail,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phone: dto.phone?.trim(),
      clinicalRole: dto.clinicalRole,
      facilityId: dto.facilityId,
      notes: notes || undefined,
      source: `${source}_create`,
      hireDetails:
        dto.payRate || dto.startDate
          ? {
              payRate: dto.payRate ?? "Per facility agreement",
              startDate: dto.startDate ?? null,
            }
          : undefined,
    });

    return this.hireAndRespond(candidateId, actorUserId);
  }

  private async hireAndRespond(candidateId: string, actorUserId: string) {
    const hire = await this.careersFunnel.hireCandidate(candidateId, actorUserId);
    const nursePortalUrl =
      this.config.get<string>("NURSE_PORTAL_URL") ?? "http://localhost:3001";
    const signInUrl = `${nursePortalUrl.replace(/\/$/, "")}/sign-in`;

    return {
      data: {
        candidateId,
        employeeNumber: hire.employeeNumber,
        signupUrl: hire.signupUrl,
        signInUrl,
        clerkInvited: hire.provision.invited,
        workerLinked: hire.provision.linked,
        workerId: hire.provision.workerId,
        email: hire.candidate.email,
        firstName: hire.candidate.firstName,
        lastName: hire.candidate.lastName,
        clinicalRole: hire.candidate.clinicalRole,
      },
    };
  }

  private async ensureCandidateRecord(input: {
    actorUserId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    clinicalRole: ClinicalRole;
    facilityId?: string;
    notes?: string;
    source: string;
    hireDetails?: { payRate: string; startDate: string | null };
  }) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: { equals: input.email, mode: "insensitive" } },
      include: {
        roles: { include: { role: true } },
      },
    });

    const workerRoles = new Set([
      PlatformRole.RN,
      PlatformRole.LPN,
      PlatformRole.CNA,
      PlatformRole.GNA,
      PlatformRole.CMA,
      PlatformRole.MED_TECH,
      PlatformRole.NURSE,
    ]);

    if (
      existingUser &&
      existingUser.roles.some((r) => workerRoles.has(r.role.name as PlatformRole))
    ) {
      throw new BadRequestException(
        "This email already has an active worker account. They can sign in at the nurse portal."
      );
    }

    const existingCandidate = await this.prisma.candidate.findFirst({
      where: { email: { equals: input.email, mode: "insensitive" } },
      orderBy: { updatedAt: "desc" },
    });

    if (existingCandidate) {
      if (existingCandidate.stage === CandidatePipelineStage.HIRED && existingCandidate.workerId) {
        throw new BadRequestException(
          `This employee is already hired (employee number ${existingCandidate.employeeNumber ?? "assigned"}).`
        );
      }

      const recruiterId = await this.resolveRecruiterId(input.actorUserId);
      const updated = await this.prisma.candidate.update({
        where: { id: existingCandidate.id },
        data: {
          recruiterId,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone ?? existingCandidate.phone,
          clinicalRole: input.clinicalRole,
          facilityId: input.facilityId ?? existingCandidate.facilityId,
          notes: input.notes ?? existingCandidate.notes,
          source: existingCandidate.source ?? input.source,
          hireDetails: input.hireDetails ?? existingCandidate.hireDetails ?? undefined,
        },
      });

      return updated.id;
    }

    const recruiterId = await this.resolveRecruiterId(input.actorUserId);
    const created = await this.prisma.candidate.create({
      data: {
        recruiterId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        clinicalRole: input.clinicalRole,
        facilityId: input.facilityId,
        notes: input.notes,
        source: input.source,
        hireDetails: input.hireDetails,
        matchScore: 80,
      },
    });

    return created.id;
  }

  private async resolveRecruiterId(actorUserId: string) {
    const recruiterRole = await this.prisma.role.findUnique({
      where: { name: DbPlatformRole.RECRUITER },
    });
    if (!recruiterRole) {
      this.logger.warn("Recruiter role missing — assigning candidate to actor");
      return actorUserId;
    }

    const isRecruiter = await this.prisma.userRole.findFirst({
      where: { userId: actorUserId, roleId: recruiterRole.id },
    });
    if (isRecruiter) return actorUserId;

    const assignment = await this.prisma.userRole.findFirst({
      where: { roleId: recruiterRole.id },
      orderBy: { grantedAt: "asc" },
    });

    return assignment?.userId ?? actorUserId;
  }
}
