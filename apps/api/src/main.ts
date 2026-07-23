import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureNestApp } from "./configure-app";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  await configureNestApp(app, { enableWebSockets: true });

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  await app.listen(port);
  console.log(`Sompacare API running on http://localhost:${port}/api/v1`);
  if (process.env.NODE_ENV !== "production") {
    console.log(`Swagger docs: http://localhost:${port}/api/v1/docs`);
  }
  console.log(`WebSocket: ws://localhost:${port}/realtime`);
}

bootstrap();
