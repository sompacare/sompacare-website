import { Module } from "@nestjs/common";
import { ComplianceModule } from "../compliance/compliance.module";
import { AiController } from "./ai.controller";
import { MatchingService } from "./matching.service";
import { OpenAiService } from "./openai.service";

@Module({
  imports: [ComplianceModule],
  controllers: [AiController],
  providers: [MatchingService, OpenAiService],
  exports: [MatchingService, OpenAiService],
})
export class AiModule {}
