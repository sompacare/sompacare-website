import { Global, Module } from "@nestjs/common";
import { RealtimeModule } from "../realtime/realtime.module";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { PushService } from "./push.service";
import { SmsService } from "./sms.service";

@Global()
@Module({
  imports: [RealtimeModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, SmsService, PushService],
  exports: [NotificationsService, SmsService, PushService],
})
export class NotificationsModule {}
