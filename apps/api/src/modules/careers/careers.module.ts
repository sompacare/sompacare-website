import { Module } from "@nestjs/common";
import { AuditModule } from "../../common/audit/audit.module";
import { StorageModule } from "../../common/storage/storage.module";
import { WorkersModule } from "../workers/workers.module";
import { ReferralsModule } from "../referrals/referrals.module";
import { CareersController } from "./careers.controller";
import { CareersFunnelService } from "./careers-funnel.service";
import { CandidateResumeSyncService } from "./candidate-resume-sync.service";
import { SupabaseResumeService } from "./supabase-resume.service";

@Module({
  imports: [AuditModule, StorageModule, WorkersModule, ReferralsModule],
  controllers: [CareersController],
  providers: [
    CareersFunnelService,
    SupabaseResumeService,
    CandidateResumeSyncService,
  ],
  exports: [CareersFunnelService, CandidateResumeSyncService],
})
export class CareersModule {}
