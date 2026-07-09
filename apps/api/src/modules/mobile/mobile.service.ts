import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MobileApp } from "@sompacare/database";
import { PrismaService } from "../../common/prisma/prisma.module";
import { PushService } from "../notifications/push.service";

@Injectable()
export class MobileService {
  private readonly logger = new Logger(MobileService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private pushService: PushService
  ) {}

  getConfig() {
    return {
      offlineClockQueue: true,
      biometricLogin: this.config.get("MOBILE_BIOMETRIC_ENABLED", "true") === "true",
      pushNotifications: true,
      documentUpload: true,
      minAppVersion: "1.0.0",
    };
  }

  async registerPushToken(
    userId: string,
    dto: { token: string; platform: string; app: MobileApp }
  ) {
    const device = await this.prisma.pushDevice.upsert({
      where: { token: dto.token },
      update: { userId, platform: dto.platform, app: dto.app },
      create: {
        userId,
        token: dto.token,
        platform: dto.platform,
        app: dto.app,
      },
    });

    if (this.pushService.isDevBypass()) {
      this.logger.log(`Push token registered (dev) user=${userId} app=${dto.app}`);
    }

    return {
      id: device.id,
      registered: true,
      devBypass: this.pushService.isDevBypass(),
    };
  }
}
