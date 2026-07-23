import { Controller, Get, Module } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { Public } from "../../common/decorators";
import { PrismaService } from "../../common/prisma/prisma.module";

@ApiTags("health")
@Controller({ path: "health", version: "1" })
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService
  ) {}

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

    let redis = "skipped";
    const redisUrl = this.config.get<string>("REDIS_URL");
    if (redisUrl) {
      redis = "ok";
      try {
        const tls = redisUrl.startsWith("rediss://") ? {} : undefined;
        const client = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          connectTimeout: 2000,
          lazyConnect: true,
          ...(tls !== undefined ? { tls } : {}),
        });
        await client.connect();
        await client.ping();
        await client.quit();
      } catch {
        redis = "error";
      }
    }

    const services = { database, redis };
    const healthy = Object.values(services).every((s) => s === "ok" || s === "skipped");

    return {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "1.0.0",
      services,
    };
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
