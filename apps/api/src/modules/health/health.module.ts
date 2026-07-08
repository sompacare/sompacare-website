import { Controller, Get, Module } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators";
import { PrismaService } from "../../common/prisma/prisma.module";

@ApiTags("health")
@Controller({ path: "health", version: "1" })
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "Health check" })
  async check() {
    let database = "ok";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = "error";
    }

    return {
      status: database === "ok" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: { database },
    };
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
