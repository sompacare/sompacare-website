import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  AuthenticatedUser,
  CurrentUser,
  Public,
  RequirePermissions,
} from "../../common/decorators";
import {
  CreateJobPostingDto,
  JobPostingQueryDto,
  UpdateJobPostingDto,
} from "./dto/job-postings.dto";
import { JobPostingsService } from "./job-postings.service";

@ApiTags("job-postings")
@Controller({ path: "job-postings", version: "1" })
export class JobPostingsController {
  constructor(private jobPostings: JobPostingsService) {}

  @Get("public")
  @Public()
  @ApiOperation({ summary: "Published job postings for careers page" })
  listPublic() {
    return this.jobPostings.listPublic();
  }

  @Get()
  @ApiBearerAuth()
  @RequirePermissions("job_postings:read")
  @ApiOperation({ summary: "List job postings (recruiter/admin)" })
  findAll(@Query() query: JobPostingQueryDto) {
    return this.jobPostings.findAll(query);
  }

  @Get(":id")
  @ApiBearerAuth()
  @RequirePermissions("job_postings:read")
  @ApiOperation({ summary: "Get job posting by id" })
  findOne(@Param("id") id: string) {
    return this.jobPostings.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @RequirePermissions("job_postings:write")
  @ApiOperation({ summary: "Create job posting" })
  create(@Body() dto: CreateJobPostingDto, @CurrentUser() user: AuthenticatedUser) {
    return this.jobPostings.create(dto, user.id);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @RequirePermissions("job_postings:write")
  @ApiOperation({ summary: "Update or publish/close job posting" })
  update(@Param("id") id: string, @Body() dto: UpdateJobPostingDto) {
    return this.jobPostings.update(id, dto);
  }
}
