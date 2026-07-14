import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  AuthenticatedUser,
  CurrentUser,
  Public,
  RequirePermissions,
} from "../../common/decorators";
import { InviteReferralDto } from "./dto/referrals.dto";
import { ReferralsService } from "./referrals.service";

@ApiTags("referrals")
@Controller({ path: "referrals", version: "1" })
export class ReferralsController {
  constructor(private referrals: ReferralsService) {}

  @Get("validate/:code")
  @Public()
  @ApiOperation({ summary: "Validate a referral code (careers apply form)" })
  validate(@Param("code") code: string) {
    return this.referrals.validateCode(code);
  }

  @Get("me")
  @ApiBearerAuth()
  @RequirePermissions("referrals:read")
  @ApiOperation({ summary: "My referral code and referral history" })
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.referrals.listMine(user.id);
  }

  @Post("me/invite")
  @ApiBearerAuth()
  @RequirePermissions("referrals:write")
  @ApiOperation({ summary: "Invite someone by email with your referral link" })
  invite(@CurrentUser() user: AuthenticatedUser, @Body() dto: InviteReferralDto) {
    return this.referrals.invite(user.id, dto.email);
  }
}
