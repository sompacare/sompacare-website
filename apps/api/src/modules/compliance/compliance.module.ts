import { Module } from "@nestjs/common";
import { AuditModule } from "../../common/audit/audit.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { CheckrService } from "./checkr.service";
import { ComplianceController } from "./compliance.controller";
import { ComplianceService } from "./compliance.service";

@Module({
  imports: [AuditModule, NotificationsModule],
  controllers: [ComplianceController],
  providers: [ComplianceService, CheckrService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
