import { Module } from "@nestjs/common";
import { AuditModule } from "../../common/audit/audit.module";
import { InvoicesModule } from "../invoices/invoices.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { TimekeepingController } from "./timekeeping.controller";
import { TimekeepingService } from "./timekeeping.service";
import { TimecardsController } from "./timecards.controller";
import { TimecardsService } from "./timecards.service";

@Module({
  imports: [AuditModule, InvoicesModule, NotificationsModule],
  controllers: [TimekeepingController, TimecardsController],
  providers: [TimekeepingService, TimecardsService],
  exports: [TimekeepingService, TimecardsService],
})
export class TimekeepingModule {}
