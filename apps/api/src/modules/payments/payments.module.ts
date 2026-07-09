import { Module } from "@nestjs/common";
import { StripeService } from "./stripe.service";
import { PaymentsController } from "./payments.controller";

@Module({
  controllers: [PaymentsController],
  providers: [StripeService],
  exports: [StripeService],
})
export class PaymentsModule {}
