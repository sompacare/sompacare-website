import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { sanitizeShiftRatesForRoles, type PlatformRole, WORKER_ROLES } from "@sompacare/shared";
import {
  AuthenticatedUser,
  CurrentUser,
  RequirePermissions,
} from "../../common/decorators";
import { ApplicationsService } from "./applications.service";
import { ApplicationQueryDto, RejectApplicationDto } from "./dto/application.dto";

@ApiTags("applications")
@ApiBearerAuth()
@Controller({ path: "applications", version: "1" })
export class ApplicationsController {
  constructor(private applicationsService: ApplicationsService) {}

  @Get()
  @RequirePermissions("applications:read")
  @ApiOperation({ summary: "List shift applications" })
  findAll(@Query() query: ApplicationQueryDto, @CurrentUser() user: AuthenticatedUser) {
    const isWorker = user.roles.some((r) => WORKER_ROLES.includes(r));
    if (isWorker) {
      query.applicantId = user.id;
    }
    return this.applicationsService.findAll(query, user.roles);
  }

  @Get(":id")
  @RequirePermissions("applications:read")
  @ApiOperation({ summary: "Get application by ID" })
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.applicationsService.findOne(id, user.roles);
  }

  @Post(":id/approve")
  @RequirePermissions("applications:write")
  @ApiOperation({ summary: "Approve a shift application and create assignment" })
  approve(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.applicationsService.approve(id, user.id, user.roles);
  }

  @Post(":id/reject")
  @RequirePermissions("applications:write")
  @ApiOperation({ summary: "Reject a shift application" })
  reject(
    @Param("id") id: string,
    @Body() dto: RejectApplicationDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.applicationsService.reject(id, user.id, dto.reason, user.roles);
  }

  @Post(":id/withdraw")
  @RequirePermissions("applications:write")
  @ApiOperation({ summary: "Withdraw own pending application" })
  withdraw(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.applicationsService.withdraw(id, user.id, user.roles);
  }
}
