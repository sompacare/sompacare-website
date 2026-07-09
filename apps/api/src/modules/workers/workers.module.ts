import { Module } from "@nestjs/common";
import { ComplianceModule } from "../compliance/compliance.module";
import { PaymentsModule } from "../payments/payments.module";
import { WorkersController } from "./workers.controller";
import { WorkersService } from "./workers.service";

@Module({
  imports: [ComplianceModule, PaymentsModule],
  controllers: [WorkersController],
  providers: [WorkersService],
  exports: [WorkersService],
})
export class WorkersModule {}
