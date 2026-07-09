import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { FeatureFlagsService } from "./feature-flags.service";
import { SupportService } from "./support.service";

@Module({
  imports: [AiModule],
  controllers: [AdminController],
  providers: [AdminService, SupportService, FeatureFlagsService],
  exports: [AdminService],
})
export class AdminModule {}
