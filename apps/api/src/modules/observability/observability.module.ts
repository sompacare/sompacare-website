import { Global, Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { MetricsController } from "./metrics.controller";
import { MetricsInterceptor } from "./metrics.interceptor";
import { MetricsService } from "./metrics.service";
import { SentryService } from "./sentry.service";

@Global()
@Module({
  controllers: [MetricsController],
  providers: [
    MetricsService,
    SentryService,
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
  exports: [MetricsService, SentryService],
})
export class ObservabilityModule {}
