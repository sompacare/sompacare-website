import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DocumentStatus, LegalDocumentType, LicenseStatus, Prisma } from "@sompacare/database";
import {
  evaluateCompliance,
  getExpirySeverity,
  reminderThreshold,
  daysUntilExpiry,
  type ComplianceEvaluation,
} from "@sompacare/shared";
import { AuditService } from "../../common/audit/audit.service";
import { paginate, paginationMeta } from "../../common/decorators";
import { PrismaService } from "../../common/prisma/prisma.module";
import { NotificationsService } from "../notifications/notifications.service";
import { LegalService } from "../legal/legal.service";
import { CheckrService } from "./checkr.service";
import {
  AlertsQueryDto,
  ComplianceQueryDto,
  SubmitCertificationDto,
  SubmitLicenseDto,
  VerifyCredentialDto,
} from "./dto/compliance.dto";

@Injectable()
export class ComplianceService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
    private checkrService: CheckrService,
    private legal: LegalService
  ) {}

  async evaluateWorker(
    userId: string,
    requiredLicenseTypes?: string[]
  ): Promise<ComplianceEvaluation> {
    const [licenses, certifications, backgroundChecks] = await Promise.all([
      this.prisma.license.findMany({ where: { userId } }),
      this.prisma.certification.findMany({ where: { userId } }),
      this.prisma.backgroundCheck.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 1,
      }),
    ]);

    return evaluateCompliance({
      requiredLicenseTypes,
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
      backgroundChecks: backgroundChecks.map((b) => ({
        id: b.id,
        status: b.status,
        completedAt: b.completedAt?.toISOString() ?? null,
      })),
    });
  }

  async assertWorkerCanBook(userId: string, requiredLicenseTypes?: string[]) {
    return this.evaluateWorker(userId, requiredLicenseTypes);
  }

  async syncComplianceScore(userId: string) {
    const evaluation = await this.evaluateWorker(userId);
    await this.prisma.workerProfile.updateMany({
      where: { userId },
      data: { complianceScore: evaluation.score },
    });
    return evaluation;
  }

  async listLicenses(query: ComplianceQueryDto, requesterId: string, canViewAll: boolean) {
    const { take, skip } = paginate(query.page, query.limit);
    const where: Prisma.LicenseWhereInput = {};

    if (query.userId) {
      if (!canViewAll && query.userId !== requesterId) {
        throw new ForbiddenException("Cannot view other workers' licenses");
      }
      where.userId = query.userId;
    } else if (!canViewAll) {
      where.userId = requesterId;
    }

    if (query.status) {
      where.status = query.status as LicenseStatus;
    }

    const [data, total] = await Promise.all([
      this.prisma.license.findMany({
        where,
        orderBy: { expiresAt: "asc" },
        take,
        skip,
      }),
      this.prisma.license.count({ where }),
    ]);

    return { data, meta: paginationMeta(total, query.page ?? 1, take) };
  }

  async submitLicense(userId: string, dto: SubmitLicenseDto) {
    const license = await this.prisma.license.create({
      data: {
        userId,
        type: dto.type.toUpperCase(),
        number: dto.number,
        state: dto.state.toUpperCase(),
        status: LicenseStatus.PENDING_VERIFICATION,
        expiresAt: new Date(dto.expiresAt),
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : undefined,
        documentUrl: dto.documentUrl,
      },
    });

    await this.audit.log({
      userId,
      action: "compliance.license.submitted",
      entityType: "License",
      entityId: license.id,
      changes: { type: license.type, state: license.state },
    });

    await this.syncComplianceScore(userId);
    return license;
  }

  async verifyLicense(id: string, verifierId: string, dto: VerifyCredentialDto) {
    const license = await this.prisma.license.findUnique({ where: { id } });
    if (!license) throw new NotFoundException("License not found");

    const status =
      dto.action === "approve" ? LicenseStatus.ACTIVE : LicenseStatus.REVOKED;

    const updated = await this.prisma.license.update({
      where: { id },
      data: {
        status,
        verifiedAt: dto.action === "approve" ? new Date() : null,
        verifiedBy: dto.action === "approve" ? verifierId : null,
      },
    });

    await this.audit.log({
      userId: verifierId,
      action: `compliance.license.${dto.action}`,
      entityType: "License",
      entityId: id,
      changes: { workerId: license.userId, reason: dto.reason },
    });

    if (dto.action === "reject") {
      const user = await this.prisma.user.findUnique({
        where: { id: license.userId },
        select: { email: true },
      });
      void this.notifications.notifyComplianceRejected(
        license.userId,
        user?.email,
        `${license.type} license`,
        dto.reason
      );
    }

    await this.syncComplianceScore(license.userId);
    return updated;
  }

  async listCertifications(
    query: ComplianceQueryDto,
    requesterId: string,
    canViewAll: boolean
  ) {
    const { take, skip } = paginate(query.page, query.limit);
    const where: Prisma.CertificationWhereInput = {};

    if (query.userId) {
      if (!canViewAll && query.userId !== requesterId) {
        throw new ForbiddenException("Cannot view other workers' certifications");
      }
      where.userId = query.userId;
    } else if (!canViewAll) {
      where.userId = requesterId;
    }

    if (query.status) {
      where.status = query.status as DocumentStatus;
    }

    const [data, total] = await Promise.all([
      this.prisma.certification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      this.prisma.certification.count({ where }),
    ]);

    return { data, meta: paginationMeta(total, query.page ?? 1, take) };
  }

  async submitCertification(userId: string, dto: SubmitCertificationDto) {
    const cert = await this.prisma.certification.create({
      data: {
        userId,
        name: dto.name,
        issuer: dto.issuer,
        status: DocumentStatus.PENDING,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : undefined,
        documentUrl: dto.documentUrl,
      },
    });

    await this.audit.log({
      userId,
      action: "compliance.certification.submitted",
      entityType: "Certification",
      entityId: cert.id,
      changes: { name: cert.name },
    });

    await this.syncComplianceScore(userId);
    return cert;
  }

  async verifyCertification(id: string, verifierId: string, dto: VerifyCredentialDto) {
    const cert = await this.prisma.certification.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException("Certification not found");

    const status =
      dto.action === "approve" ? DocumentStatus.VERIFIED : DocumentStatus.REJECTED;

    const updated = await this.prisma.certification.update({
      where: { id },
      data: { status },
    });

    await this.audit.log({
      userId: verifierId,
      action: `compliance.certification.${dto.action}`,
      entityType: "Certification",
      entityId: id,
      changes: { workerId: cert.userId, reason: dto.reason },
    });

    if (dto.action === "reject") {
      const user = await this.prisma.user.findUnique({
        where: { id: cert.userId },
        select: { email: true },
      });
      void this.notifications.notifyComplianceRejected(
        cert.userId,
        user?.email,
        cert.name,
        dto.reason
      );
    }

    await this.syncComplianceScore(cert.userId);
    return updated;
  }

  async listAlerts(query: AlertsQueryDto, requesterId: string, canViewAll: boolean) {
    const { take, skip } = paginate(query.page, query.limit);
    const where: Prisma.ComplianceAlertWhereInput = {
      isResolved: query.resolved ?? false,
    };

    if (query.userId) {
      if (!canViewAll && query.userId !== requesterId) {
        throw new ForbiddenException("Cannot view other workers' alerts");
      }
      where.userId = query.userId;
    } else if (!canViewAll) {
      where.userId = requesterId;
    }

    const [data, total] = await Promise.all([
      this.prisma.complianceAlert.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      this.prisma.complianceAlert.count({ where }),
    ]);

    return { data, meta: paginationMeta(total, query.page ?? 1, take) };
  }

  async resolveAlert(id: string, userId: string) {
    const alert = await this.prisma.complianceAlert.findFirst({
      where: { id, userId },
    });
    if (!alert) throw new NotFoundException("Alert not found");

    return this.prisma.complianceAlert.update({
      where: { id },
      data: { isResolved: true, resolvedAt: new Date() },
    });
  }

  async getVerificationQueue() {
    const [licenses, certifications] = await Promise.all([
      this.prisma.license.findMany({
        where: { status: LicenseStatus.PENDING_VERIFICATION },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.certification.findMany({
        where: { status: DocumentStatus.PENDING },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return { licenses, certifications, total: licenses.length + certifications.length };
  }

  async initiateBackgroundCheck(userId: string) {
    const hasConsent = await this.legal.hasConsent({
      userId,
      documentType: LegalDocumentType.BACKGROUND_CHECK_DISCLOSURE,
      context: "background_check",
    });
    if (!hasConsent) {
      throw new BadRequestException(
        "Background check disclosure consent is required before initiating screening"
      );
    }

    const pending = await this.prisma.backgroundCheck.findFirst({
      where: { userId, status: DocumentStatus.PENDING },
    });
    if (pending) {
      throw new BadRequestException("Background check already in progress");
    }

    const result = await this.checkrService.initiateBackgroundCheck(userId);

    await this.audit.log({
      userId,
      action: "compliance.background_check.initiated",
      entityType: "BackgroundCheck",
      entityId: result.check.id,
    });

    await this.syncComplianceScore(userId);
    return result;
  }

  async onBackgroundCheckUpdated(userId: string, checkId: string) {
    await this.syncComplianceScore(userId);
    await this.audit.log({
      userId,
      action: "compliance.background_check.updated",
      entityType: "BackgroundCheck",
      entityId: checkId,
    });

    const check = await this.prisma.backgroundCheck.findUnique({ where: { id: checkId } });
    if (check?.status === DocumentStatus.VERIFIED) {
      await this.prisma.candidate.updateMany({
        where: { workerId: userId },
        data: { backgroundCheckStatus: "cleared" },
      });
    } else if (check?.status === DocumentStatus.REJECTED) {
      await this.prisma.candidate.updateMany({
        where: { workerId: userId },
        data: { backgroundCheckStatus: "failed" },
      });
    } else if (check?.status === DocumentStatus.PENDING) {
      await this.prisma.candidate.updateMany({
        where: { workerId: userId },
        data: { backgroundCheckStatus: "in_progress" },
      });
    }
  }

  async getBackgroundChecks(userId: string) {
    const checks = await this.prisma.backgroundCheck.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return { data: checks };
  }

  async scanExpirations() {
    const now = new Date();
    const results = { alertsCreated: 0, expired: 0, notified: 0 };

    const licenses = await this.prisma.license.findMany({
      where: {
        status: { in: [LicenseStatus.ACTIVE, LicenseStatus.PENDING_VERIFICATION] },
      },
      include: { user: { select: { id: true, email: true, firstName: true } } },
    });

    for (const license of licenses) {
      const days = daysUntilExpiry(license.expiresAt, now);
      const severity = getExpirySeverity(license.expiresAt, now);

      if (days <= 0) {
        await this.prisma.license.update({
          where: { id: license.id },
          data: { status: LicenseStatus.EXPIRED },
        });
        await this.createAlertIfNew({
          userId: license.userId,
          type: "license.expired",
          severity: "critical",
          message: `${license.type} license (${license.state}) has expired`,
          entityType: "License",
          entityId: license.id,
        });
        results.expired++;
        await this.syncComplianceScore(license.userId);
        continue;
      }

      const threshold = reminderThreshold(days);
      if (threshold) {
        const created = await this.createAlertIfNew({
          userId: license.userId,
          type: `license.expiring_${threshold}d`,
          severity,
          message: `${license.type} license expires in ${days} day(s)`,
          entityType: "License",
          entityId: license.id,
        });
        if (created) {
          results.alertsCreated++;
          void this.notifications.notifyComplianceExpiring(
            license.userId,
            license.user.email,
            `${license.type} license`,
            days,
            license.id
          );
          results.notified++;
        }
      }
    }

    const certifications = await this.prisma.certification.findMany({
      where: { status: DocumentStatus.VERIFIED, expiresAt: { not: null } },
      include: { user: { select: { id: true, email: true } } },
    });

    for (const cert of certifications) {
      if (!cert.expiresAt) continue;
      const days = daysUntilExpiry(cert.expiresAt, now);
      const severity = getExpirySeverity(cert.expiresAt, now);

      if (days <= 0) {
        await this.prisma.certification.update({
          where: { id: cert.id },
          data: { status: DocumentStatus.EXPIRED },
        });
        await this.createAlertIfNew({
          userId: cert.userId,
          type: "certification.expired",
          severity: "critical",
          message: `${cert.name} certification has expired`,
          entityType: "Certification",
          entityId: cert.id,
        });
        results.expired++;
        await this.syncComplianceScore(cert.userId);
        continue;
      }

      const threshold = reminderThreshold(days);
      if (threshold) {
        const created = await this.createAlertIfNew({
          userId: cert.userId,
          type: `certification.expiring_${threshold}d`,
          severity,
          message: `${cert.name} certification expires in ${days} day(s)`,
          entityType: "Certification",
          entityId: cert.id,
        });
        if (created) {
          results.alertsCreated++;
          void this.notifications.notifyComplianceExpiring(
            cert.userId,
            cert.user.email,
            cert.name,
            days,
            cert.id
          );
          results.notified++;
        }
      }
    }

    return results;
  }

  private async createAlertIfNew(input: {
    userId: string;
    type: string;
    severity: string;
    message: string;
    entityType: string;
    entityId: string;
  }) {
    const existing = await this.prisma.complianceAlert.findFirst({
      where: {
        userId: input.userId,
        type: input.type,
        entityId: input.entityId,
        isResolved: false,
      },
    });
    if (existing) return false;

    await this.prisma.complianceAlert.create({ data: input });
    return true;
  }
}
