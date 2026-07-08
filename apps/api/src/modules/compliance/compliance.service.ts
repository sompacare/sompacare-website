import { Injectable } from "@nestjs/common";
import { evaluateCompliance, type ComplianceEvaluation } from "@sompacare/shared";
import { PrismaService } from "../../common/prisma/prisma.module";

@Injectable()
export class ComplianceService {
  constructor(private prisma: PrismaService) {}

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
    const evaluation = await this.evaluateWorker(userId, requiredLicenseTypes);
    return evaluation;
  }
}
