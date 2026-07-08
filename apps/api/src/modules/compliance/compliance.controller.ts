import { Controller, Get, Param } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  AuthenticatedUser,
  CurrentUser,
  RequirePermissions,
} from "../../common/decorators";
import { ComplianceService } from "./compliance.service";

@ApiTags("compliance")
@ApiBearerAuth()
@Controller({ path: "compliance", version: "1" })
export class ComplianceController {
  constructor(private complianceService: ComplianceService) {}

  @Get("workers/:userId")
  @RequirePermissions("compliance:read")
  @ApiOperation({ summary: "Evaluate worker compliance status" })
  async getWorkerCompliance(
    @Param("userId") userId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const canViewOthers = user.roles.some((r) =>
      ["SUPER_ADMIN", "ADMIN", "COMPLIANCE_OFFICER", "FACILITY_MANAGER", "FACILITY_STAFF"].includes(r)
    );
    const targetId = canViewOthers ? userId : user.id;
    const data = await this.complianceService.evaluateWorker(targetId);
    return { data };
  }

  @Get("me")
  @RequirePermissions("compliance:read")
  @ApiOperation({ summary: "Get current worker compliance status" })
  async getMyCompliance(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.complianceService.evaluateWorker(user.id);
    return { data };
  }
}
