import { Module } from "@nestjs/common";
import { AuditModule } from "../../common/audit/audit.module";
import { LegalModule } from "../legal/legal.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { CheckrService } from "./checkr.service";
import { CheckrWebhookController } from "./checkr-webhook.controller";
import { ComplianceController } from "./compliance.controller";
import { ComplianceService } from "./compliance.service";

@Module({
  imports: [AuditModule, NotificationsModule, LegalModule],
  controllers: [ComplianceController, CheckrWebhookController],
  providers: [ComplianceService, CheckrService],
  exports: [ComplianceService, CheckrService],
})
export class ComplianceModule {}
