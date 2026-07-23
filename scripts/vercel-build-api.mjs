#!/usr/bin/env node
/**
 * Vercel build for NestJS API (monorepo root install).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, env = {}) {
  console.log(`> ${cmd}`);
  execSync(cmd, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, NPM_CONFIG_PRODUCTION: "false", ...env },
  });
}

if (!process.env.DATABASE_URL?.trim()) {
  console.warn(
    "[vercel-build-api] DATABASE_URL unset at build time — OK if set in Vercel Production env."
  );
}
if (!process.env.DIRECT_DATABASE_URL?.trim() && process.env.DATABASE_URL?.trim()) {
  process.env.DIRECT_DATABASE_URL = process.env.DATABASE_URL;
}

run("npx prisma@6.9.0 generate --schema packages/database/prisma/schema.prisma");
const clientIndex = path.join(root, "node_modules/.prisma/client/index.js");
if (!fs.existsSync(clientIndex)) {
  console.error("[vercel-build-api] Prisma client missing after generate");
  process.exit(1);
}
run("npm run build --workspace=@sompacare/shared");
run("npm run build --workspace=@sompacare/api");

const serverlessOut = path.join(root, "apps/api/dist/serverless.js");
if (!fs.existsSync(serverlessOut)) {
  console.error("[vercel-build-api] Missing apps/api/dist/serverless.js after build");
  process.exit(1);
}

console.log("[vercel-build-api] Ready for Vercel serverless.");
