import {
  Controller,
  Get,
  Headers,
  Post,
  RawBodyRequest,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { CurrentUser, AuthenticatedUser, Public } from "../../common/decorators";
import { AuthService } from "./auth.service";

@ApiTags("auth")
@Controller({ path: "auth", version: "1" })
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService
  ) {}

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current authenticated user" })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const fullUser = await this.authService.getMe(user.id);
    return { data: fullUser };
  }

  @Post("bootstrap-worker")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Ensure nurse portal user has worker role, profile, and wallet" })
  bootstrapWorker(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.bootstrapWorkerAccess(user.id, user.email);
  }

  @Post("webhook/clerk")
  @Public()
  @ApiOperation({ summary: "Clerk user lifecycle webhook" })
  async clerkWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("svix-id") svixId: string,
    @Headers("svix-timestamp") svixTimestamp: string,
    @Headers("svix-signature") svixSignature: string
  ) {
    const webhookSecret = this.config.get<string>("CLERK_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new UnauthorizedException("Webhook secret not configured");
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new UnauthorizedException("Missing raw body for webhook verification");
    }

    const { Webhook } = await import("svix");
    const wh = new Webhook(webhookSecret);

    let event: { type: string; data: Record<string, unknown> };
    try {
      event = wh.verify(rawBody.toString(), {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as { type: string; data: Record<string, unknown> };
    } catch {
      throw new UnauthorizedException("Invalid webhook signature");
    }

    const result = await this.authService.handleClerkWebhook(
      event as Parameters<AuthService["handleClerkWebhook"]>[0]
    );
    return { data: result };
  }
}
