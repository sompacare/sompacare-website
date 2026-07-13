import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { StripeService } from "./stripe.service";
import { PaymentsController } from "./payments.controller";
import { PaymentSettlementService } from "./payment-settlement.service";

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController],
  providers: [StripeService, PaymentSettlementService],
  exports: [StripeService, PaymentSettlementService],
})
export class PaymentsModule {}
