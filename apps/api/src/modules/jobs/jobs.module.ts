import { Module } from "@nestjs/common";
import { RealtimeModule } from "../realtime/realtime.module";
import { JobsService } from "./jobs.service";

@Module({
  imports: [RealtimeModule],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
