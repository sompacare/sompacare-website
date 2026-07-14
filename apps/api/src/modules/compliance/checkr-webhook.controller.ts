import { BadRequestException, Controller, Headers, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { Public } from "../../common/decorators";
import { ComplianceService } from "./compliance.service";
import { CheckrService } from "./checkr.service";

@ApiTags("compliance")
@Controller({ path: "compliance/checkr", version: "1" })
export class CheckrWebhookController {
  constructor(
    private checkr: CheckrService,
    private compliance: ComplianceService
  ) {}

  @Post("webhook")
  @Public()
  @ApiOperation({ summary: "Checkr webhook for background check status updates" })
  async handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers("x-checkr-signature") signature: string | undefined
  ) {
    const raw =
      req.rawBody?.toString("utf8") ??
      (typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {}));

    if (!this.checkr.verifyWebhookSignature(raw, signature)) {
      throw new BadRequestException("Invalid Checkr webhook signature");
    }

    const payload = typeof req.body === "object" ? req.body : JSON.parse(raw);
    const result = await this.checkr.applyWebhookUpdate(payload);
    if (result.updated && result.check) {
      await this.compliance.onBackgroundCheckUpdated(result.check.userId, result.check.id);
    }
    return { received: true, ...result };
  }
}
