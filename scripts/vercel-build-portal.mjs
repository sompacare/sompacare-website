#!/usr/bin/env node
/**
 * Vercel build helper for monorepo Next.js portals (Phase 1).
 * Usage: node scripts/vercel-build-portal.mjs admin-portal
 *
 * Install is handled by Vercel (see each app vercel.json installCommand).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const portal = process.argv[2];
const valid = ["nurse-portal", "facility-portal", "admin-portal", "recruiter-portal"];
if (!portal || !valid.includes(portal)) {
  console.error(`Usage: node scripts/vercel-build-portal.mjs <${valid.join("|")}>`);
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
process.env.NODE_OPTIONS = process.env.NODE_OPTIONS ?? "--max-old-space-size=6144";
process.env.NEXT_TELEMETRY_DISABLED = "1";
process.env.CI = "true";

const clerkPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
if (!clerkPk) {
  console.error(
    "\n[vercel-build-portal] BUILD FAILED: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing.\n" +
      "Add it in Vercel → Project → Settings → Environment Variables (Production), then redeploy.\n"
  );
  process.exit(1);
}
if (!clerkPk.startsWith("pk_")) {
  console.error("\n[vercel-build-portal] BUILD FAILED: publishable key must start with pk_\n");
  process.exit(1);
}

console.log(`[vercel-build-portal] ${portal}: Clerk key ${clerkPk.slice(0, 12)}…`);

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: process.env, ...opts });
}

run(`npm run build --workspace=@sompacare/${portal}`);

const nextDir = path.join(root, "apps", portal, ".next");
if (!fs.existsSync(nextDir)) {
  console.error(`Build finished but missing ${nextDir}`);
  process.exit(1);
}

console.log(`\nVercel build OK: @sompacare/${portal}`);
