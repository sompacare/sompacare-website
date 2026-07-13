import { Module } from "@nestjs/common";
import { AuditModule } from "../../common/audit/audit.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PaymentsModule } from "../payments/payments.module";
import { WalletModule } from "../wallet/wallet.module";
import { PayrollController } from "./payroll.controller";
import { PayrollService } from "./payroll.service";
import { PayoutGateService } from "./payout-gate.service";

@Module({
  imports: [AuditModule, WalletModule, PaymentsModule, NotificationsModule],
  controllers: [PayrollController],
  providers: [PayrollService, PayoutGateService],
  exports: [PayrollService, PayoutGateService],
})
export class PayrollModule {}
