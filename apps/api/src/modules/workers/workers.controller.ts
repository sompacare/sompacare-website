import { Body, Controller, Get, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  AuthenticatedUser,
  CurrentUser,
  RequirePermissions,
} from "../../common/decorators";
import { WorkersService } from "./workers.service";
import { UpdateWorkerProfileDto } from "./dto/worker.dto";

@ApiTags("workers")
@ApiBearerAuth()
@Controller({ path: "workers", version: "1" })
export class WorkersController {
  constructor(private workersService: WorkersService) {}

  @Get("me/profile")
  @RequirePermissions("compliance:read")
  @ApiOperation({ summary: "Get current worker profile with compliance status" })
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.workersService.getProfile(user.id);
  }

  @Patch("me/profile")
  @RequirePermissions("applications:write")
  @ApiOperation({ summary: "Update current worker profile" })
  updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateWorkerProfileDto
  ) {
    return this.workersService.updateProfile(user.id, dto);
  }
}
