import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import express from "express";
import { AppModule } from "./app.module";
import { configureNestApp } from "./configure-app";

type ExpressApp = ReturnType<typeof express>;

let cachedServer: ExpressApp | null = null;

/**
 * Cached Express server for Vercel serverless (REST + webhooks only; no WebSockets).
 */
export async function getServer(): Promise<ExpressApp> {
  if (cachedServer) return cachedServer;

  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    rawBody: true,
    logger: process.env.NODE_ENV === "production" ? ["error", "warn"] : undefined,
  });

  await configureNestApp(app, { enableWebSockets: false });
  await app.init();

  cachedServer = expressApp;
  return expressApp;
}
