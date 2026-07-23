import type { INestApplication } from "@nestjs/common";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { IoAdapter } from "@nestjs/platform-socket.io";
import helmet from "helmet";

export type ConfigureAppOptions = {
  /** Socket.IO is not supported on Vercel serverless — disable there. */
  enableWebSockets?: boolean;
};

export async function configureNestApp(
  app: INestApplication,
  { enableWebSockets = true }: ConfigureAppOptions = {}
) {
  if (enableWebSockets) {
    app.useWebSocketAdapter(new IoAdapter(app));
  }

  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) ?? [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
      "http://localhost:3004",
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

  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Sompacare Platform API")
      .setDescription("Enterprise healthcare staffing marketplace API")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/v1/docs", app, document);
  }
}
