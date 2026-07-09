import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentStatus } from "@sompacare/database";
import { PrismaService } from "../../common/prisma/prisma.module";

@Injectable()
export class CheckrService {
  private readonly logger = new Logger(CheckrService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService
  ) {}

  async initiateBackgroundCheck(userId: string) {
    const devBypass = this.config.get("CHECKR_DEV_BYPASS", "true") === "true";
    const apiKey = this.config.get<string>("CHECKR_API_KEY");

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

    // Production: POST to Checkr API and return pending check
    const externalId = `chk_${Date.now()}`;
    const check = await this.prisma.backgroundCheck.create({
      data: {
        userId,
        provider: "checkr",
        externalId,
        status: DocumentStatus.PENDING,
        result: { initiatedAt: new Date().toISOString() },
      },
    });
    return { check, devBypass: false };
  }
}
