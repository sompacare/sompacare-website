import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from "prom-client";

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly logger = new Logger(MetricsService.name);
  readonly registry = new Registry();

  private readonly httpRequestsTotal: Counter<string>;
  private readonly httpRequestDuration: Histogram<string>;

  constructor(private config: ConfigService) {
    this.httpRequestsTotal = new Counter({
      name: "http_requests_total",
      help: "Total HTTP requests",
      labelNames: ["method", "route", "status"],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: "http_request_duration_seconds",
      help: "HTTP request duration in seconds",
      labelNames: ["method", "route", "status"],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
      registers: [this.registry],
    });
  }

  onModuleInit() {
    if (this.config.get("METRICS_ENABLED", "true") !== "true") {
      this.logger.warn("Prometheus metrics disabled");
      return;
    }
    collectDefaultMetrics({ register: this.registry });
    this.logger.log("Prometheus metrics enabled at /api/v1/metrics");
  }

  isEnabled() {
    return this.config.get("METRICS_ENABLED", "true") === "true";
  }

  recordRequest(method: string, route: string, status: number, durationMs: number) {
    if (!this.isEnabled()) return;
    const labels = { method, route, status: String(status) };
    this.httpRequestsTotal.inc(labels);
    this.httpRequestDuration.observe(labels, durationMs / 1000);
  }

  async getMetrics() {
    return this.registry.metrics();
  }
}
