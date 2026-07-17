import { Body, Controller, Module, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  AuthenticatedUser,
  CurrentUser,
  RequirePermissions,
} from "../../common/decorators";
import { CareersModule } from "../careers/careers.module";
import {
  CreateWorkerEmployeeDto,
  QuickInviteWorkerDto,
} from "./dto/worker-onboarding.dto";
import { WorkerOnboardingService } from "./worker-onboarding.service";

@ApiTags("worker-onboarding")
@Controller({ path: "worker-onboarding", version: "1" })
export class WorkerOnboardingController {
  constructor(private onboarding: WorkerOnboardingService) {}

  @Post("admin/invite")
  @ApiBearerAuth()
  @RequirePermissions("users:write")
  @ApiOperation({ summary: "Admin: invite a worker by email (creates employee ID + portal access)" })
  adminQuickInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: QuickInviteWorkerDto
  ) {
    return this.onboarding.quickInvite(user.id, dto, "admin");
  }

  @Post("admin/create")
  @ApiBearerAuth()
  @RequirePermissions("users:write")
  @ApiOperation({ summary: "Admin: create a worker with full employee details" })
  adminCreate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWorkerEmployeeDto
  ) {
    return this.onboarding.createEmployee(user.id, dto, "admin");
  }

  @Post("recruiter/invite")
  @ApiBearerAuth()
  @RequirePermissions("recruiter:placements")
  @ApiOperation({ summary: "Recruiter: invite a worker by email" })
  recruiterQuickInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: QuickInviteWorkerDto
  ) {
    return this.onboarding.quickInvite(user.id, dto, "recruiter");
  }

  @Post("recruiter/create")
  @ApiBearerAuth()
  @RequirePermissions("recruiter:placements")
  @ApiOperation({ summary: "Recruiter: create a worker with full employee details" })
  recruiterCreate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWorkerEmployeeDto
  ) {
    return this.onboarding.createEmployee(user.id, dto, "recruiter");
  }
}

@Module({
  imports: [CareersModule],
  controllers: [WorkerOnboardingController],
  providers: [WorkerOnboardingService],
  exports: [WorkerOnboardingService],
})
export class WorkerOnboardingModule {}
