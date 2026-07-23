#!/usr/bin/env node
/**
 * Copy portal env vars to Production + Preview + Development on all four Vercel projects.
 * Git branch deploys use Preview env during build — required for NEXT_PUBLIC_CLERK_* at build time.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scope = process.env.VERCEL_SCOPE ?? "sompacare-staffing";

const PORTALS = [
  { project: "sompacare-admin", stripe: false },
  { project: "sompacare-nurse", stripe: true },
  { project: "sompacare-facility", stripe: true },
  { project: "sompacare-recruiter", stripe: false },
];

const ENV_KEYS = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL",
  "NEXT_PUBLIC_CLERK_IS_SATELLITE",
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
];

const DEFAULTS = {
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in",
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up",
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: "/home",
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: "/home",
  NEXT_PUBLIC_CLERK_IS_SATELLITE: "false",
  NEXT_PUBLIC_API_URL: "https://api.sompacare.com/api/v1",
};

const TARGETS = ["production", "preview", "development"];

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

function loadPortalEnv() {
  const merged = { ...DEFAULTS };
  for (const file of [
    path.join(root, ".env.platform"),
    path.join(root, ".env.local"),
    path.join(root, ".env.vercel-portals"),
    path.join(root, ".env.platform.live"),
  ]) {
    Object.assign(merged, parseEnvFile(file));
  }
  return merged;
}

function run(cmd) {
  console.log(`> ${cmd.slice(0, 120)}…`);
  execSync(cmd, { cwd: root, stdio: "inherit", env: process.env });
}

const env = loadPortalEnv();
if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_")) {
  console.error("Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in .env.platform.live or .env.vercel-portals");
  process.exit(1);
}

for (const { project, stripe } of PORTALS) {
  console.log(`\n=== ${project} ===`);
  for (const target of TARGETS) {
    for (const key of ENV_KEYS) {
      if (key === "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" && !stripe) continue;
      const value = env[key]?.trim();
      if (!value) continue;
      const sensitive = key.includes("SECRET") || key.includes("STRIPE") || key.startsWith("CLERK_");
      const sensFlag = sensitive && target !== "development" ? " --sensitive" : "";
      run(
        `npx vercel env add ${key} ${target}${sensFlag} --force --yes --project ${project} --scope ${scope} --value "${value.replace(/"/g, '\\"')}"`
      );
    }
  }
}

console.log("\nEnv synced to production, preview, and development for all portal projects.");
