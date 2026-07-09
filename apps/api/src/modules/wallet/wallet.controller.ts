import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  AuthenticatedUser,
  CurrentUser,
  RequirePermissions,
} from "../../common/decorators";
import { StripeService } from "../payments/stripe.service";
import { InstantPayDto, WalletTransactionsQueryDto } from "./dto/wallet.dto";
import { WalletService } from "./wallet.service";
import { PrismaService } from "../../common/prisma/prisma.module";

@ApiTags("wallet")
@ApiBearerAuth()
@Controller({ path: "wallet", version: "1" })
export class WalletController {
  constructor(
    private walletService: WalletService,
    private stripeService: StripeService,
    private prisma: PrismaService
  ) {}

  @Get()
  @RequirePermissions("wallet:read")
  @ApiOperation({ summary: "Get worker wallet balance" })
  getWallet(@CurrentUser() user: AuthenticatedUser) {
    return this.walletService.getWallet(user.id);
  }

  @Get("transactions")
  @RequirePermissions("wallet:read")
  @ApiOperation({ summary: "Wallet transaction history" })
  getTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: WalletTransactionsQueryDto
  ) {
    return this.walletService.getTransactions(
      user.id,
      query.page,
      query.limit
    );
  }

  @Post("instant-pay")
  @RequirePermissions("wallet:instant_pay")
  @ApiOperation({ summary: "Request instant payout to bank" })
  async instantPay(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InstantPayDto
  ) {
    const wallet = await this.walletService.getWallet(user.id);
    const amount = dto.amount ?? wallet.balance;
    if (amount <= 0) {
      throw new BadRequestException("No balance available for instant pay");
    }

    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId: user.id },
    });
    if (!profile?.stripeAccountId) {
      throw new BadRequestException("Stripe account not set up");
    }

    const transferId = await this.stripeService.createInstantPayout({
      accountId: profile.stripeAccountId,
      amountCents: Math.round(amount * 100),
    });

    return this.walletService.instantPay(user.id, amount, transferId);
  }
}
