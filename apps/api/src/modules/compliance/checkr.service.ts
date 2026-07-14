import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";
import { DocumentStatus } from "@sompacare/database";
import { PrismaService } from "../../common/prisma/prisma.module";

type CheckrCandidate = { id: string };
type CheckrReport = { id: string; status: string; result?: string | null };

@Injectable()
export class CheckrService {
  private readonly logger = new Logger(CheckrService.name);
  private readonly apiBase = "https://api.checkr.com/v1";

  constructor(
    private config: ConfigService,
    private prisma: PrismaService
  ) {}

  private authHeader(apiKey: string) {
    return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
  }

  async initiateBackgroundCheck(userId: string) {
    const devBypass = this.config.get("CHECKR_DEV_BYPASS", "true") === "true";
    const apiKey = this.config.get<string>("CHECKR_API_KEY");

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true, phone: true },
    });
    if (!user) throw new BadRequestException("User not found");

    if (devBypass || !apiKey) {
      this.logger.log(`Checkr dev bypass for user ${userId}`);
      const check = await this.prisma.backgroundCheck.create({
        data: {
          userId,
          provider: "checkr",
          externalId: `dev_${Date.now()}`,
          status: DocumentStatus.VERIFIED,
          completedAt: new Date(),
          result: { devBypass: true, status: "clear" },
        },
      });
      return { check, devBypass: true };
    }

    const candidate = await this.createCheckrCandidate(apiKey, user);
    const report = await this.orderReport(apiKey, candidate.id);

    const check = await this.prisma.backgroundCheck.create({
      data: {
        userId,
        provider: "checkr",
        externalId: report.id,
        status: DocumentStatus.PENDING,
        result: {
          candidateId: candidate.id,
          reportId: report.id,
          status: report.status,
          initiatedAt: new Date().toISOString(),
        },
      },
    });

    return { check, devBypass: false, invitationPending: true };
  }

  private async createCheckrCandidate(
    apiKey: string,
    user: { email: string; firstName: string; lastName: string; phone: string | null }
  ): Promise<CheckrCandidate> {
    const res = await fetch(`${this.apiBase}/candidates`, {
      method: "POST",
      headers: {
        Authorization: this.authHeader(apiKey),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        phone: user.phone ?? undefined,
        work_locations: [{ country: "US" }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Checkr candidate create failed: ${res.status} ${text}`);
      throw new BadRequestException("Could not initiate background check with screening partner");
    }

    return (await res.json()) as CheckrCandidate;
  }

  private async orderReport(apiKey: string, candidateId: string): Promise<CheckrReport> {
    const packageName =
      this.config.get<string>("CHECKR_PACKAGE") ?? "tasker_standard";

    const res = await fetch(`${this.apiBase}/reports`, {
      method: "POST",
      headers: {
        Authorization: this.authHeader(apiKey),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        candidate_id: candidateId,
        package: packageName,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Checkr report order failed: ${res.status} ${text}`);
      throw new BadRequestException("Could not order background check report");
    }

    return (await res.json()) as CheckrReport;
  }

  verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
    const secret = this.config.get<string>("CHECKR_WEBHOOK_SECRET");
    if (!secret) return this.config.get("CHECKR_DEV_BYPASS", "true") === "true";
    if (!signature) return false;

    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  mapCheckrStatus(result: string | null | undefined, status: string): DocumentStatus {
    const normalized = (result ?? status).toLowerCase();
    if (["clear", "completed", "complete"].includes(normalized)) {
      return DocumentStatus.VERIFIED;
    }
    if (["consider", "suspended", "dispute"].includes(normalized)) {
      return DocumentStatus.PENDING;
    }
    if (["rejected", "failed", "canceled", "cancelled"].includes(normalized)) {
      return DocumentStatus.REJECTED;
    }
    return DocumentStatus.PENDING;
  }

  async applyWebhookUpdate(payload: {
    type?: string;
    data?: { object?: { id?: string; status?: string; result?: string | null } };
  }) {
    const report = payload.data?.object;
    if (!report?.id) return { updated: false, reason: "no_report_id" as const };

    const check = await this.prisma.backgroundCheck.findFirst({
      where: { externalId: report.id, provider: "checkr" },
    });
    if (!check) return { updated: false, reason: "check_not_found" as const };

    const status = this.mapCheckrStatus(report.result, report.status ?? "");
    const completed =
      status === DocumentStatus.VERIFIED || status === DocumentStatus.REJECTED;

    const updated = await this.prisma.backgroundCheck.update({
      where: { id: check.id },
      data: {
        status,
        completedAt: completed ? new Date() : null,
        result: {
          ...(typeof check.result === "object" && check.result ? check.result : {}),
          webhookType: payload.type,
          status: report.status,
          result: report.result,
          updatedAt: new Date().toISOString(),
        },
      },
    });

    return { updated: true, check: updated };
  }
}
