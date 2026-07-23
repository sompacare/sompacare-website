#!/usr/bin/env node
/**
 * Push API env vars to Vercel sompacare-api (Production + Preview).
 * Reads .env.platform.live, .env.platform, .env.vercel-api (gitignored).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scope = process.env.VERCEL_SCOPE ?? "sompacare-staffing";
const project = "sompacare-api";

const ENV_KEYS = [
  "DATABASE_URL",
  "CLERK_SECRET_KEY",
  "CLERK_WEBHOOK_SECRET",
  "CORS_ORIGINS",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "GOOGLE_MAPS_API_KEY",
  "CAREERS_INGEST_SECRET",
  "NODE_ENV",
  "AUTH_ALLOW_DEV_TOKENS",
  "GEOFENCE_DEV_BYPASS",
  "PAYMENTS_DEV_BYPASS",
  "JOBS_DEV_BYPASS",
  "SMS_DEV_BYPASS",
  "PUSH_DEV_BYPASS",
  "API_PUBLIC_URL",
];

const PRODUCTION_DEFAULTS = {
  NODE_ENV: "production",
  AUTH_ALLOW_DEV_TOKENS: "false",
  GEOFENCE_DEV_BYPASS: "false",
  PAYMENTS_DEV_BYPASS: "false",
  JOBS_DEV_BYPASS: "false",
  SMS_DEV_BYPASS: "false",
  PUSH_DEV_BYPASS: "false",
  API_PUBLIC_URL: "https://api.sompacare.com/api/v1",
  CORS_ORIGINS:
    "https://www.sompacare.com,https://sompacare.com,https://nurse.sompacare.com,https://facility.sompacare.com,https://recruiter.sompacare.com,https://admin.sompacare.com",
};

const TARGETS = ["production", "preview"];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function loadEnv() {
  const merged = { ...PRODUCTION_DEFAULTS };
  for (const file of [
    path.join(root, ".env.platform"),
    path.join(root, ".env.platform.live"),
    path.join(root, ".env.vercel-api"),
    path.join(root, ".env.local"),
  ]) {
    Object.assign(merged, parseEnvFile(file));
  }
  if (!merged.SUPABASE_URL && merged.NEXT_PUBLIC_SUPABASE_URL) {
    merged.SUPABASE_URL = merged.NEXT_PUBLIC_SUPABASE_URL;
  }
  return merged;
}

function run(cmd) {
  console.log(`> ${cmd.slice(0, 100)}…`);
  execSync(cmd, { cwd: root, stdio: "inherit", env: process.env });
}

const env = loadEnv();
if (!env.DATABASE_URL?.includes("postgres")) {
  console.error("Missing DATABASE_URL (Supabase pooler or Postgres URI) in .env.platform.live");
  process.exit(1);
}
if (!env.CLERK_SECRET_KEY?.startsWith("sk_")) {
  console.error("Missing CLERK_SECRET_KEY");
  process.exit(1);
}

for (const target of TARGETS) {
  console.log(`\n=== ${project} (${target}) ===`);
  for (const key of ENV_KEYS) {
    const value = env[key]?.trim();
    if (!value) continue;
    const sensitive =
      key.includes("SECRET") ||
      key.includes("KEY") ||
      key === "DATABASE_URL" ||
      key.includes("TOKEN");
    const sensFlag = sensitive ? " --sensitive" : "";
    run(
      `npx vercel env add ${key} ${target}${sensFlag} --force --yes --project ${project} --scope ${scope} --value "${value.replace(/"/g, '\\"')}"`
    );
  }
}

console.log("\nAPI env synced. Redeploy sompacare-api on Vercel.");
