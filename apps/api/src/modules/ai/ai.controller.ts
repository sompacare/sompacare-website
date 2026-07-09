import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  AuthenticatedUser,
  CurrentUser,
  RequirePermissions,
} from "../../common/decorators";
import { MatchingService } from "./matching.service";
import { AiQueryDto } from "./dto/ai.dto";

@ApiTags("ai")
@ApiBearerAuth()
@Controller({ path: "ai", version: "1" })
export class AiController {
  constructor(private matching: MatchingService) {}

  @Get("recommendations/shifts")
  @RequirePermissions("shifts:read")
  @ApiOperation({ summary: "AI-ranked shift recommendations for worker" })
  getRecommendations(@CurrentUser() user: AuthenticatedUser, @Query() query: AiQueryDto) {
    return this.matching.getRecommendedShifts(user.id, query.limit);
  }

  @Get("payroll/anomalies")
  @RequirePermissions("payroll:read")
  @ApiOperation({ summary: "Detect payroll/timecard anomalies" })
  getPayrollAnomalies(@Query("facilityId") facilityId?: string) {
    return this.matching.scanPayrollAnomalies(facilityId);
  }

  @Get("compliance/risks/:userId")
  @RequirePermissions("compliance:read")
  @ApiOperation({ summary: "AI compliance risk assessment" })
  getComplianceRisks(@Param("userId") userId: string) {
    return this.matching.assessComplianceRisks(userId);
  }
}
