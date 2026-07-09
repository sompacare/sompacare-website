import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private config: ConfigService) {}

  isDevBypass() {
    return (
      this.config.get("PUSH_DEV_BYPASS", "true") === "true" ||
      !this.config.get("FIREBASE_PROJECT_ID")
    );
  }

  async sendPush(
    userId: string,
    title: string,
    body: string
  ): Promise<{ sent: boolean; devBypass: boolean }> {
    if (this.isDevBypass()) {
      this.logger.log(`Push dev bypass → user ${userId}: ${title}`);
      return { sent: true, devBypass: true };
    }

    this.logger.warn("Firebase push not fully wired — log only");
    return { sent: false, devBypass: false };
  }
}
