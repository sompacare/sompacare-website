import { Controller, Get, Header } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators";
import { MetricsService } from "./metrics.service";

@ApiTags("observability")
@Controller({ path: "metrics", version: "1" })
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get()
  @Public()
  @Header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
  @ApiOperation({ summary: "Prometheus metrics scrape endpoint" })
  async getMetrics() {
    if (!this.metricsService.isEnabled()) {
      return "# metrics disabled\n";
    }
    return this.metricsService.getMetrics();
  }
}
