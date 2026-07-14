import { Module } from "@nestjs/common";
import { AuditModule } from "../../common/audit/audit.module";
import { AiModule } from "../ai/ai.module";
import { CareersModule } from "../careers/careers.module";
import { ComplianceModule } from "../compliance/compliance.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { RecruitersController } from "./recruiters.controller";
import { RecruitersService } from "./recruiters.service";
import { ResumeParserService } from "./resume-parser.service";

@Module({
  imports: [AuditModule, NotificationsModule, AiModule, CareersModule, ComplianceModule],
  controllers: [RecruitersController],
  providers: [RecruitersService, ResumeParserService],
  exports: [RecruitersService],
})
export class RecruitersModule {}
