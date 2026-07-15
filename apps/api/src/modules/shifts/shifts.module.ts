import { Module } from "@nestjs/common";
import { GeocodingModule } from "../../common/geocoding/geocoding.module";
import { AiModule } from "../ai/ai.module";
import { ComplianceModule } from "../compliance/compliance.module";
import { JobsModule } from "../jobs/jobs.module";
import { PlatformModule } from "../platform/platform.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { ShiftsController } from "./shifts.controller";
import { ShiftsService } from "./shifts.service";

@Module({
  imports: [ComplianceModule, AiModule, JobsModule, RealtimeModule, GeocodingModule, PlatformModule],
  controllers: [ShiftsController],
  providers: [ShiftsService],
  exports: [ShiftsService],
})
export class ShiftsModule {}
