import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  RawBodyRequest,
  Req,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators";
import { PrismaService } from "../../common/prisma/prisma.module";
import { StripeService } from "./stripe.service";
import type { Request } from "express";
import Stripe from "stripe";
import { InvoiceStatus, PaymentStatus } from "@sompacare/database";

@ApiTags("payments")
@Controller({ path: "payments", version: "1" })
export class PaymentsController {
  constructor(
    private stripeService: StripeService,
    private config: ConfigService,
    private prisma: PrismaService
  ) {}

  @Post("stripe/webhook")
  @Public()
  @ApiOperation({ summary: "Stripe platform webhook" })
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string
  ) {
    if (this.stripeService.isDevBypass()) {
      return { received: true, devBypass: true };
    }

    const secret = this.config.get<string>("STRIPE_WEBHOOK_SECRET");
    if (!secret) {
      throw new BadRequestException("STRIPE_WEBHOOK_SECRET not configured");
    }

    const stripe = this.stripeService.getClient();
    const event = stripe.webhooks.constructEvent(
      req.rawBody as Buffer,
      signature,
      secret
    );

    const eventType = event.type as string;

    if (eventType === "v2.core.account.updated") {
      const account = (event as Stripe.Event).data.object as {
        id: string;
        metadata?: { sompacare_user_id?: string };
        configuration?: { recipient?: { applied?: boolean } };
        requirements?: { entries?: Array<{ errors: unknown[] }> };
      };
      const userId = account.metadata?.sompacare_user_id;
      const recipient = account.configuration?.recipient;
      const hasErrors =
        account.requirements?.entries?.some((e) => e.errors.length > 0) ?? false;
      if (userId && recipient?.applied && !hasErrors) {
        await this.prisma.workerProfile.updateMany({
          where: { userId },
          data: {
            stripeOnboarded: true,
            stripeAccountId: account.id,
            instantPayEnabled: true,
          },
        });
      }
      return { received: true };
    }

    switch (event.type) {
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const userId = account.metadata?.sompacare_user_id;
        if (userId && account.charges_enabled && account.payouts_enabled) {
          await this.prisma.workerProfile.updateMany({
            where: { userId },
            data: {
              stripeOnboarded: true,
              stripeAccountId: account.id,
              instantPayEnabled: true,
            },
          });
        }
        break;
      }
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const invoiceId = intent.metadata?.sompacare_invoice_id;
        if (invoiceId) {
          await this.prisma.$transaction([
            this.prisma.payment.create({
              data: {
                invoiceId,
                amount: intent.amount_received / 100,
                status: PaymentStatus.COMPLETED,
                method: "stripe",
                stripePaymentId: intent.id,
                processedAt: new Date(),
              },
            }),
            this.prisma.invoice.update({
              where: { id: invoiceId },
              data: { status: InvoiceStatus.PAID, paidAt: new Date() },
            }),
          ]);
        }
        break;
      }
    }

    return { received: true };
  }
}
