import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  AuthenticatedUser,
  CurrentUser,
  RequirePermissions,
} from "../../common/decorators";
import { ComplianceService } from "./compliance.service";
import {
  AlertsQueryDto,
  ComplianceQueryDto,
  SubmitCertificationDto,
  SubmitLicenseDto,
  VerifyCredentialDto,
} from "./dto/compliance.dto";

const OFFICER_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "COMPLIANCE_OFFICER",
  "FACILITY_MANAGER",
  "FACILITY_STAFF",
];

const VERIFY_ROLES = ["SUPER_ADMIN", "ADMIN", "COMPLIANCE_OFFICER"];

@ApiTags("compliance")
@ApiBearerAuth()
@Controller({ path: "compliance", version: "1" })
export class ComplianceController {
  constructor(private complianceService: ComplianceService) {}

  private canViewOthers(user: AuthenticatedUser) {
    return user.roles.some((r) => OFFICER_ROLES.includes(r));
  }

  private canVerify(user: AuthenticatedUser) {
    return user.roles.some((r) => VERIFY_ROLES.includes(r));
  }

  @Get("me")
  @RequirePermissions("compliance:read")
  @ApiOperation({ summary: "Get current worker compliance status" })
  async getMyCompliance(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.complianceService.syncComplianceScore(user.id);
    return { data };
  }

  @Get("workers/:userId")
  @RequirePermissions("compliance:read")
  @ApiOperation({ summary: "Evaluate worker compliance status" })
  async getWorkerCompliance(
    @Param("userId") userId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const targetId = this.canViewOthers(user) ? userId : user.id;
    const data = await this.complianceService.evaluateWorker(targetId);
    return { data };
  }

  @Get("score/:userId")
  @RequirePermissions("compliance:read")
  @ApiOperation({ summary: "Get compliance score for a worker" })
  async getScore(
    @Param("userId") userId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const targetId = this.canViewOthers(user) ? userId : user.id;
    const data = await this.complianceService.syncComplianceScore(targetId);
    return { data: { userId: targetId, score: data.score, isCompliant: data.isCompliant } };
  }

  @Get("licenses")
  @RequirePermissions("compliance:read")
  @ApiOperation({ summary: "List licenses" })
  listLicenses(
    @Query() query: ComplianceQueryDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.complianceService.listLicenses(query, user.id, this.canViewOthers(user));
  }

  @Post("licenses")
  @RequirePermissions("compliance:write")
  @ApiOperation({ summary: "Submit a license for verification" })
  submitLicense(
    @Body() dto: SubmitLicenseDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.complianceService.submitLicense(user.id, dto);
  }

  @Patch("licenses/:id/verify")
  @RequirePermissions("compliance:verify")
  @ApiOperation({ summary: "Approve or reject a submitted license" })
  verifyLicense(
    @Param("id") id: string,
    @Body() dto: VerifyCredentialDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    if (!this.canVerify(user)) {
      throw new ForbiddenException("Compliance verification requires officer role");
    }
    return this.complianceService.verifyLicense(id, user.id, dto);
  }

  @Get("certifications")
  @RequirePermissions("compliance:read")
  @ApiOperation({ summary: "List certifications" })
  listCertifications(
    @Query() query: ComplianceQueryDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.complianceService.listCertifications(
      query,
      user.id,
      this.canViewOthers(user)
    );
  }

  @Post("certifications")
  @RequirePermissions("compliance:write")
  @ApiOperation({ summary: "Submit a certification for verification" })
  submitCertification(
    @Body() dto: SubmitCertificationDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.complianceService.submitCertification(user.id, dto);
  }

  @Patch("certifications/:id/verify")
  @RequirePermissions("compliance:verify")
  @ApiOperation({ summary: "Approve or reject a submitted certification" })
  verifyCertification(
    @Param("id") id: string,
    @Body() dto: VerifyCredentialDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.complianceService.verifyCertification(id, user.id, dto);
  }

  @Get("alerts")
  @RequirePermissions("compliance:read")
  @ApiOperation({ summary: "List compliance alerts" })
  listAlerts(
    @Query() query: AlertsQueryDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.complianceService.listAlerts(
      query,
      user.id,
      this.canViewOthers(user)
    );
  }

  @Patch("alerts/:id/resolve")
  @RequirePermissions("compliance:read")
  @ApiOperation({ summary: "Resolve a compliance alert" })
  resolveAlert(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.complianceService.resolveAlert(id, user.id);
  }

  @Get("verification-queue")
  @RequirePermissions("compliance:verify")
  @ApiOperation({ summary: "Pending licenses and certifications to verify" })
  verificationQueue() {
    return this.complianceService.getVerificationQueue();
  }

  @Post("scan-expirations")
  @RequirePermissions("compliance:verify")
  @ApiOperation({ summary: "Scan credentials for expirations and send reminders" })
  scanExpirations() {
    return this.complianceService.scanExpirations();
  }

  @Post("background-checks")
  @RequirePermissions("compliance:write")
  @ApiOperation({ summary: "Initiate background check (Checkr)" })
  initiateBackgroundCheck(@CurrentUser() user: AuthenticatedUser) {
    return this.complianceService.initiateBackgroundCheck(user.id);
  }
}
