import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SupportTicketStatus } from "@sompacare/database";
import {
  AuthenticatedUser,
  CurrentUser,
  RequirePermissions,
} from "../../common/decorators";
import { AdminService } from "./admin.service";
import { FeatureFlagsService } from "./feature-flags.service";
import { SupportService } from "./support.service";
import {
  AuditLogQueryDto,
  CreateSupportTicketDto,
  UpdateFeatureFlagDto,
  UpdateSupportTicketDto,
} from "./dto/admin.dto";

@ApiTags("admin")
@ApiBearerAuth()
@Controller({ path: "admin", version: "1" })
export class AdminController {
  constructor(
    private adminService: AdminService,
    private supportService: SupportService,
    private flagsService: FeatureFlagsService
  ) {}

  @Get("dashboard")
  @RequirePermissions("admin:dashboard")
  @ApiOperation({ summary: "Platform KPI dashboard" })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get("insights")
  @RequirePermissions("admin:analytics")
  @ApiOperation({ summary: "AI insights and activity summary" })
  getInsights() {
    return this.adminService.getInsights();
  }

  @Get("audit-logs")
  @RequirePermissions("admin:audit_logs")
  @ApiOperation({ summary: "Audit log viewer" })
  getAuditLogs(@Query() query: AuditLogQueryDto) {
    return this.adminService.listAuditLogs(query);
  }

  @Get("support-tickets")
  @RequirePermissions("support:read")
  @ApiOperation({ summary: "List support tickets" })
  listTickets(
    @Query("status") status?: SupportTicketStatus,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.supportService.findAll(status, page, limit);
  }

  @Post("support-tickets")
  @RequirePermissions("support:write")
  @ApiOperation({ summary: "Create support ticket" })
  createTicket(@Body() dto: CreateSupportTicketDto, @CurrentUser() user: AuthenticatedUser) {
    return this.supportService.create(user.id, dto);
  }

  @Patch("support-tickets/:id")
  @RequirePermissions("support:write")
  @ApiOperation({ summary: "Update support ticket" })
  updateTicket(@Param("id") id: string, @Body() dto: UpdateSupportTicketDto) {
    return this.supportService.update(id, dto);
  }

  @Get("feature-flags")
  @RequirePermissions("admin:feature_flags")
  @ApiOperation({ summary: "List feature flags" })
  listFlags() {
    return this.flagsService.findAll();
  }

  @Patch("feature-flags/:key")
  @RequirePermissions("admin:feature_flags")
  @ApiOperation({ summary: "Toggle feature flag" })
  updateFlag(@Param("key") key: string, @Body() dto: UpdateFeatureFlagDto) {
    return this.flagsService.update(key, dto);
  }
}
