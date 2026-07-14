import { Module } from "@nestjs/common";
import { AuditModule } from "../../common/audit/audit.module";
import { WalletModule } from "../wallet/wallet.module";
import { ReferralsController } from "./referrals.controller";
import { ReferralsService } from "./referrals.service";

@Module({
  imports: [AuditModule, WalletModule],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
