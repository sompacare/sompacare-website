import {
  Body,
  Controller,
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
import {
  CandidateQueryDto,
  CreateCandidateDto,
  ParseResumeDto,
  ScheduleInterviewDto,
  SendOfferDto,
  UpdateCandidateStageDto,
  UpdateChecklistDto,
} from "./dto/recruiters.dto";
import { RecruitersService } from "./recruiters.service";

@ApiTags("recruiters")
@ApiBearerAuth()
@Controller({ path: "recruiters", version: "1" })
export class RecruitersController {
  constructor(private recruitersService: RecruitersService) {}

  @Get("pipeline")
  @RequirePermissions("recruiter:pipeline")
  @ApiOperation({ summary: "Kanban pipeline board" })
  getPipeline(@CurrentUser() user: AuthenticatedUser) {
    return this.recruitersService.getPipeline(user.id);
  }

  @Get("candidates")
  @RequirePermissions("recruiter:pipeline")
  @ApiOperation({ summary: "List candidates" })
  findAll(@Query() query: CandidateQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.recruitersService.findAll(
      user.id,
      query.stage,
      query.page,
      query.limit
    );
  }

  @Post("candidates")
  @RequirePermissions("recruiter:pipeline")
  @ApiOperation({ summary: "Add candidate to pipeline" })
  create(@Body() dto: CreateCandidateDto, @CurrentUser() user: AuthenticatedUser) {
    return this.recruitersService.create(dto, user.id);
  }

  @Get("candidates/:id")
  @RequirePermissions("recruiter:pipeline")
  @ApiOperation({ summary: "Get candidate detail" })
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.recruitersService.findOne(id, user.id);
  }

  @Patch("candidates/:id/stage")
  @RequirePermissions("recruiter:pipeline")
  @ApiOperation({ summary: "Move candidate to pipeline stage" })
  updateStage(
    @Param("id") id: string,
    @Body() dto: UpdateCandidateStageDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.recruitersService.updateStage(id, user.id, dto);
  }

  @Post("candidates/:id/interviews")
  @RequirePermissions("recruiter:pipeline")
  @ApiOperation({ summary: "Schedule interview" })
  scheduleInterview(
    @Param("id") id: string,
    @Body() dto: ScheduleInterviewDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.recruitersService.scheduleInterview(id, user.id, dto);
  }

  @Post("candidates/:id/offer")
  @RequirePermissions("recruiter:placements")
  @ApiOperation({ summary: "Send offer letter" })
  sendOffer(
    @Param("id") id: string,
    @Body() dto: SendOfferDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.recruitersService.sendOffer(id, user.id, dto);
  }

  @Post("candidates/:id/offer/accept")
  @RequirePermissions("recruiter:placements")
  @ApiOperation({ summary: "Mark offer accepted" })
  acceptOffer(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.recruitersService.acceptOffer(id, user.id);
  }

  @Post("candidates/:id/onboarding")
  @RequirePermissions("recruiter:placements")
  @ApiOperation({ summary: "Send onboarding package" })
  sendOnboarding(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.recruitersService.sendOnboarding(id, user.id);
  }

  @Post("candidates/:id/parse-resume")
  @RequirePermissions("recruiter:pipeline")
  @ApiOperation({ summary: "Parse resume with AI (dev bypass)" })
  parseResume(
    @Param("id") id: string,
    @Body() dto: ParseResumeDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.recruitersService.parseResume(id, user.id, dto.resumeText);
  }

  @Patch("candidates/:id/checklist")
  @RequirePermissions("recruiter:pipeline")
  @ApiOperation({ summary: "Update background/reference check status" })
  updateChecklist(
    @Param("id") id: string,
    @Body() dto: UpdateChecklistDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.recruitersService.updateChecklist(id, user.id, dto);
  }

  @Get("metrics")
  @RequirePermissions("recruiter:pipeline")
  @ApiOperation({ summary: "Recruiter placement metrics" })
  getMetrics(@CurrentUser() user: AuthenticatedUser) {
    return this.recruitersService.getMetrics(user.id);
  }

  @Get("leaderboard")
  @RequirePermissions("recruiter:pipeline")
  @ApiOperation({ summary: "Recruiter placement leaderboard" })
  getLeaderboard() {
    return this.recruitersService.getLeaderboard();
  }
}
