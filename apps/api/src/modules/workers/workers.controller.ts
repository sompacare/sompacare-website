import { BadRequestException, Body, Controller, Get, Patch, Post } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  AuthenticatedUser,
  CurrentUser,
  RequirePermissions,
} from "../../common/decorators";
import { WorkersService } from "./workers.service";
import { UpdateWorkerProfileDto } from "./dto/worker.dto";
import { StripeService } from "../payments/stripe.service";
import { PrismaService } from "../../common/prisma/prisma.module";

@ApiTags("workers")
@ApiBearerAuth()
@Controller({ path: "workers", version: "1" })
export class WorkersController {
  constructor(
    private workersService: WorkersService,
    private stripeService: StripeService,
    private prisma: PrismaService,
    private config: ConfigService
  ) {}

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

  @Post("me/stripe/onboard")
  @RequirePermissions("wallet:read")
  @ApiOperation({ summary: "Start Stripe Connect onboarding for payouts" })
  async startStripeOnboard(@CurrentUser() user: AuthenticatedUser) {
    const dbUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { profile: true },
    });
    if (!dbUser.profile) {
      await this.workersService.ensureWorkerProfile(user.id);
    }
    const profile = await this.prisma.workerProfile.findUniqueOrThrow({
      where: { userId: user.id },
    });

    const accountId = await this.stripeService.ensureConnectAccount({
      userId: user.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      existingAccountId: profile.stripeAccountId,
    });

    if (profile.stripeAccountId !== accountId) {
      await this.prisma.workerProfile.update({
        where: { userId: user.id },
        data: { stripeAccountId: accountId },
      });
    }

    const portalUrl = this.config.get("NURSE_PORTAL_URL", "http://localhost:3001");
    const url = await this.stripeService.createConnectOnboardingLink(
      accountId,
      `${portalUrl}/wallet?stripe=refresh`,
      `${portalUrl}/wallet?stripe=complete`
    );

    if (this.stripeService.isDevBypass()) {
      await this.prisma.workerProfile.update({
        where: { userId: user.id },
        data: { stripeOnboarded: true, instantPayEnabled: true },
      });
    }

    return { url, devBypass: this.stripeService.isDevBypass() };
  }

  @Post("me/stripe/sync")
  @RequirePermissions("wallet:read")
  @ApiOperation({ summary: "Sync Stripe Connect onboarding status after return" })
  async syncStripeOnboard(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId: user.id },
    });
    if (!profile?.stripeAccountId) {
      throw new BadRequestException("Stripe account not set up");
    }

    const ready = await this.stripeService.getConnectAccountReady(
      profile.stripeAccountId
    );
    if (ready) {
      await this.prisma.workerProfile.update({
        where: { userId: user.id },
        data: {
          stripeOnboarded: true,
          instantPayEnabled: true,
        },
      });
    }

    return {
      stripeOnboarded: ready,
      instantPayEnabled: ready,
    };
  }
}
