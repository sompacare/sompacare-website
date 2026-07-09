import { Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { WORKER_ROLES } from "@sompacare/shared";
import {
  AuthenticatedUser,
  CurrentUser,
  RequirePermissions,
} from "../../common/decorators";
import { TimecardQueryDto } from "./dto/timecard.dto";
import { TimecardsService } from "./timecards.service";

@ApiTags("timecards")
@ApiBearerAuth()
@Controller({ path: "timecards", version: "1" })
export class TimecardsController {
  constructor(private timecardsService: TimecardsService) {}

  @Get()
  @RequirePermissions("timecards:read")
  @ApiOperation({ summary: "List timecards" })
  findAll(@Query() query: TimecardQueryDto, @CurrentUser() user: AuthenticatedUser) {
    const isWorker = user.roles.some((r) => WORKER_ROLES.includes(r));
    if (isWorker) {
      query.workerId = user.id;
    }
    return this.timecardsService.findAll(query);
  }

  @Get(":id")
  @RequirePermissions("timecards:read")
  @ApiOperation({ summary: "Get timecard by ID" })
  findOne(@Param("id") id: string) {
    return this.timecardsService.findOne(id);
  }

  @Patch(":id/approve")
  @RequirePermissions("timecards:approve")
  @ApiOperation({ summary: "Facility approves a submitted timecard" })
  approve(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.timecardsService.approve(id, user.id);
  }
}
