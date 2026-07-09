import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private config: ConfigService) {}

  isDevBypass() {
    return (
      this.config.get("SMS_DEV_BYPASS", "true") === "true" ||
      !this.config.get("TWILIO_ACCOUNT_SID")
    );
  }

  async sendSms(to: string, body: string): Promise<{ sent: boolean; devBypass: boolean }> {
    if (this.isDevBypass()) {
      this.logger.log(`SMS dev bypass → ${to}: ${body.slice(0, 80)}`);
      return { sent: true, devBypass: true };
    }

    const sid = this.config.get("TWILIO_ACCOUNT_SID");
    const token = this.config.get("TWILIO_AUTH_TOKEN");
    const from = this.config.get("TWILIO_FROM_NUMBER");
    if (!sid || !token || !from) {
      this.logger.warn("Twilio not configured");
      return { sent: false, devBypass: false };
    }

    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const params = new URLSearchParams({ To: to, From: from, Body: body });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      }
    );

    if (!res.ok) {
      this.logger.warn(`Twilio failed: ${await res.text()}`);
      return { sent: false, devBypass: false };
    }

    return { sent: true, devBypass: false };
  }
}
