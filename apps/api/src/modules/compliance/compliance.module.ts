import { Module } from "@nestjs/common";
import { AuditModule } from "../../common/audit/audit.module";
import { LegalModule } from "../legal/legal.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { ComplianceController } from "./compliance.controller";
import { ComplianceService } from "./compliance.service";

@Module({
  imports: [AuditModule, NotificationsModule, LegalModule],
  controllers: [ComplianceController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
