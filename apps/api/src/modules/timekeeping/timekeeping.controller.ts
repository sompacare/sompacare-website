import { Body, Controller, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  AuthenticatedUser,
  CurrentUser,
  RequirePermissions,
} from "../../common/decorators";
import { ClockLocationDto } from "./dto/clock.dto";
import { TimekeepingService } from "./timekeeping.service";

@ApiTags("timekeeping")
@ApiBearerAuth()
@Controller({ path: "assignments", version: "1" })
export class TimekeepingController {
  constructor(private timekeepingService: TimekeepingService) {}

  @Post(":id/clock-in")
  @RequirePermissions("assignments:confirm")
  @ApiOperation({ summary: "GPS clock in at facility" })
  clockIn(
    @Param("id") id: string,
    @Body() dto: ClockLocationDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.timekeepingService.clockIn(id, user.id, dto);
  }

  @Post(":id/clock-out")
  @RequirePermissions("assignments:confirm")
  @ApiOperation({ summary: "GPS clock out and generate timecard" })
  clockOut(
    @Param("id") id: string,
    @Body() dto: ClockLocationDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.timekeepingService.clockOut(id, user.id, dto);
  }
}
