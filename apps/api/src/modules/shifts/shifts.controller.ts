import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { WORKER_ROLES } from "@sompacare/shared";
import {
  AuthenticatedUser,
  CurrentUser,
  RequirePermissions,
} from "../../common/decorators";
import { ShiftsService } from "./shifts.service";
import { MatchingService } from "../ai/matching.service";
import {
  ApplyShiftDto,
  CreateShiftDto,
  ShiftQueryDto,
  UpdateShiftDto,
} from "./dto/shift.dto";

@ApiTags("shifts")
@ApiBearerAuth()
@Controller({ path: "shifts", version: "1" })
export class ShiftsController {
  constructor(
    private shiftsService: ShiftsService,
    private matchingService: MatchingService
  ) {}

  @Get()
  @RequirePermissions("shifts:read")
  @ApiOperation({ summary: "Search and list shifts" })
  findAll(@Query() query: ShiftQueryDto, @CurrentUser() user: AuthenticatedUser) {
    const isWorker = user.roles.some((r) => WORKER_ROLES.includes(r));
    if (isWorker && !query.facilityId) {
      return this.shiftsService.findPublished(query, user);
    }
    return this.shiftsService.findAll(query, user);
  }

  @Get(":id/matches")
  @RequirePermissions("shifts:read")
  @ApiOperation({ summary: "AI-ranked worker matches for shift" })
  getMatches(@Param("id") id: string) {
    return this.matchingService.getShiftMatches(id);
  }

  @Get(":id")
  @RequirePermissions("shifts:read")
  @ApiOperation({ summary: "Get shift by ID" })
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.shiftsService.findOne(id, user);
  }

  @Post()
  @RequirePermissions("shifts:write")
  @ApiOperation({ summary: "Create a new shift" })
  create(@Body() dto: CreateShiftDto, @CurrentUser() user: AuthenticatedUser) {
    return this.shiftsService.create(dto, user);
  }

  @Patch(":id")
  @RequirePermissions("shifts:write")
  @ApiOperation({ summary: "Update a shift" })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateShiftDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.shiftsService.update(id, dto, user);
  }

  @Post(":id/publish")
  @RequirePermissions("shifts:publish")
  @ApiOperation({ summary: "Publish a draft shift" })
  publish(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.shiftsService.publish(id, user);
  }

  @Delete(":id")
  @RequirePermissions("shifts:delete")
  @ApiOperation({ summary: "Cancel a shift" })
  cancel(
    @Param("id") id: string,
    @Body("reason") reason: string | undefined,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.shiftsService.cancel(id, reason, user);
  }

  @Post(":id/applications")
  @RequirePermissions("applications:write")
  @ApiOperation({ summary: "Apply to a shift" })
  apply(
    @Param("id") id: string,
    @Body() dto: ApplyShiftDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.shiftsService.apply(id, user.id, dto);
  }
}
