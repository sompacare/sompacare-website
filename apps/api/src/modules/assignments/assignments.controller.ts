import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { WORKER_ROLES } from "@sompacare/shared";
import {
  AuthenticatedUser,
  CurrentUser,
  RequirePermissions,
} from "../../common/decorators";
import { AssignmentsService } from "./assignments.service";
import { AssignmentQueryDto, CancelAssignmentDto } from "./dto/assignment.dto";

@ApiTags("assignments")
@ApiBearerAuth()
@Controller({ path: "assignments", version: "1" })
export class AssignmentsController {
  constructor(private assignmentsService: AssignmentsService) {}

  @Get()
  @RequirePermissions("assignments:read")
  @ApiOperation({ summary: "List shift assignments" })
  findAll(@Query() query: AssignmentQueryDto, @CurrentUser() user: AuthenticatedUser) {
    const isWorker = user.roles.some((r) => WORKER_ROLES.includes(r));
    if (isWorker) {
      query.workerId = user.id;
    }
    return this.assignmentsService.findAll(query);
  }

  @Get(":id")
  @RequirePermissions("assignments:read")
  @ApiOperation({ summary: "Get assignment by ID" })
  findOne(@Param("id") id: string) {
    return this.assignmentsService.findOne(id);
  }

  @Post(":id/confirm")
  @RequirePermissions("assignments:confirm")
  @ApiOperation({ summary: "Worker confirms an approved assignment" })
  confirm(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.assignmentsService.confirm(id, user.id);
  }

  @Patch(":id/cancel")
  @RequirePermissions("assignments:write")
  @ApiOperation({ summary: "Cancel an assignment" })
  cancel(
    @Param("id") id: string,
    @Body() dto: CancelAssignmentDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.assignmentsService.cancel(id, user.id, dto.reason);
  }
}
