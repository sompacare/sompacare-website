import { Body, Controller, Get, Module, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  AuthenticatedUser,
  CurrentUser,
  Public,
  RequirePermissions,
} from "../../common/decorators";
import {
  AcceptFacilityInviteDto,
  AdminInviteFacilityManagerDto,
  SelfServiceFacilityOnboardingDto,
} from "./dto/facility-onboarding.dto";
import { FacilityOnboardingService } from "./facility-onboarding.service";
import { NotificationsModule } from "../notifications/notifications.module";

@ApiTags("facility-onboarding")
@Controller({ path: "facility-onboarding", version: "1" })
export class FacilityOnboardingController {
  constructor(private onboarding: FacilityOnboardingService) {}

  @Get("status")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Facility portal onboarding status for current user" })
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.onboarding.getStatus(user.id, user.email, user.roles);
  }

  @Post("self-service")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Self-service facility + organization setup" })
  selfService(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SelfServiceFacilityOnboardingDto
  ) {
    return this.onboarding.selfService(user.id, user.email, dto);
  }

  @Get("invite")
  @Public()
  @ApiOperation({ summary: "Preview a facility manager invite by token" })
  getInvitePreview(@Query("token") token: string) {
    if (!token?.trim()) {
      return { data: null };
    }
    return this.onboarding.getInvitePreview(token.trim());
  }

  @Post("accept-invite")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Accept a facility manager invite" })
  acceptInvite(@CurrentUser() user: AuthenticatedUser, @Body() dto: AcceptFacilityInviteDto) {
    return this.onboarding.acceptInvite(user.id, user.email, dto.token.trim());
  }

  @Post("admin/invite")
  @ApiBearerAuth()
  @RequirePermissions("organizations:write")
  @ApiOperation({ summary: "Admin: invite a facility manager (creates org + facility)" })
  adminInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AdminInviteFacilityManagerDto
  ) {
    return this.onboarding.adminInvite(user.id, dto);
  }

  @Get("admin/invites")
  @ApiBearerAuth()
  @RequirePermissions("organizations:read")
  @ApiOperation({ summary: "Admin: list facility manager invites" })
  listInvites(@Query("page") page = 1, @Query("limit") limit = 20) {
    return this.onboarding.listInvites(Number(page), Number(limit));
  }
}

@Module({
  imports: [NotificationsModule],
  controllers: [FacilityOnboardingController],
  providers: [FacilityOnboardingService],
  exports: [FacilityOnboardingService],
})
export class FacilityOnboardingModule {}
