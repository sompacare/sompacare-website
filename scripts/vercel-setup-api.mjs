#!/usr/bin/env node
/**
 * Create/link sompacare-api Vercel project (root apps/api, branch platform).
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scope = process.env.VERCEL_SCOPE ?? "sompacare-staffing";
const project = "sompacare-api";
const dir = "apps/api";

function run(cmd, cwd = root) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit", env: process.env });
}

console.log(`Linking ${project} (root ${dir})…`);
run(`npx vercel link --yes --project ${project} --scope ${scope}`, path.join(root, dir));

console.log("\nNext steps:");
console.log("  1. node scripts/vercel-sync-api-env.mjs   (DATABASE_URL + secrets from .env.platform.live)");
console.log("  2. npx vercel --prod --scope", scope, "from apps/api (or push platform → deploy)");
console.log("  3. Vercel → sompacare-api → Domains → api.sompacare.com");
console.log("  4. Clerk + Stripe webhooks → https://api.sompacare.com/api/v1/...");
console.log("  5. npm run smoke:production");
