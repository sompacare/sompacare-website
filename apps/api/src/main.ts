import { NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(",") ?? [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
    ],
    credentials: true,
  });

  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Sompacare Platform API")
    .setDescription("Enterprise healthcare staffing marketplace API")
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("health", "Health checks")
    .addTag("auth", "Authentication")
    .addTag("users", "User management")
    .addTag("organizations", "Organizations")
    .addTag("facilities", "Healthcare facilities")
    .addTag("shifts", "Shift marketplace")
    .addTag("applications", "Shift applications")
    .addTag("assignments", "Shift assignments")
    .addTag("compliance", "Credential compliance")
    .addTag("workers", "Worker profiles")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/v1/docs", app, document);

  const port = process.env.API_PORT ?? 4000;
  await app.listen(port);
  console.log(`Sompacare API running on http://localhost:${port}/api/v1`);
  console.log(`Swagger docs: http://localhost:${port}/api/v1/docs`);
}

bootstrap();
