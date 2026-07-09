import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { IsEnum, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { MobileApp } from "@sompacare/database";
import {
  AuthenticatedUser,
  CurrentUser,
  Public,
  RequirePermissions,
} from "../../common/decorators";
import { MobileService } from "./mobile.service";

class RegisterPushTokenDto {
  @ApiProperty()
  @IsString()
  @MinLength(8)
  token!: string;

  @ApiProperty({ example: "ios" })
  @IsString()
  platform!: string;

  @ApiProperty({ enum: MobileApp })
  @IsEnum(MobileApp)
  app!: MobileApp;
}

@ApiTags("mobile")
@Controller({ path: "mobile", version: "1" })
export class MobileController {
  constructor(private mobileService: MobileService) {}

  @Get("config")
  @Public()
  @ApiOperation({ summary: "Mobile app configuration" })
  getConfig() {
    return this.mobileService.getConfig();
  }

  @Post("push-token")
  @ApiBearerAuth()
  @RequirePermissions("notifications:read")
  @ApiOperation({ summary: "Register Expo push token for mobile notifications" })
  registerPushToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterPushTokenDto
  ) {
    return this.mobileService.registerPushToken(user.id, dto);
  }
}
