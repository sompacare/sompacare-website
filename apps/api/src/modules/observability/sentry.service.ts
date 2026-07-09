import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SentryService implements OnModuleInit {
  private readonly logger = new Logger(SentryService.name);
  private enabled = false;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const dsn = this.config.get<string>("SENTRY_DSN");
    if (!dsn) {
      this.logger.log("Sentry disabled (SENTRY_DSN not set)");
      return;
    }

    this.enabled = true;
    this.logger.log("Sentry error tracking enabled");
  }

  isEnabled() {
    return this.enabled;
  }

  captureException(error: unknown, context?: Record<string, unknown>) {
    if (!this.enabled) {
      this.logger.error(context ? JSON.stringify(context) : "", error);
      return;
    }

    // Production: wire @sentry/node SDK here when SENTRY_DSN is configured
    this.logger.error(
      `[Sentry] ${error instanceof Error ? error.message : String(error)}`,
      context ? JSON.stringify(context) : undefined
    );
  }
}
