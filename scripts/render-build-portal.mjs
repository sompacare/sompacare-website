#!/usr/bin/env node
/**
 * Render build helper for monorepo Next.js portals.
 * Usage: node scripts/render-build-portal.mjs nurse-portal
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const portal = process.argv[2];
const valid = ["nurse-portal", "facility-portal", "admin-portal", "recruiter-portal"];
if (!portal || !valid.includes(portal)) {
  console.error(`Usage: node scripts/render-build-portal.mjs <${valid.join("|")}>`);
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
process.env.NODE_OPTIONS = process.env.NODE_OPTIONS ?? "--max-old-space-size=6144";

const clerkPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
if (!clerkPk) {
  console.error(
    "\n[render-build-portal] BUILD FAILED: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing.\n" +
      "Link the Render env group `sompacare-portal-auth` to this service (or set the key on the service),\n" +
      "then redeploy with Clear build cache.\n"
  );
  process.exit(1);
}
if (!clerkPk.startsWith("pk_")) {
  console.error(
    "\n[render-build-portal] BUILD FAILED: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must start with pk_\n"
  );
  process.exit(1);
}

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: process.env, ...opts });
}

process.env.NEXT_TELEMETRY_DISABLED = "1";
process.env.CI = "true";

console.log(
  `[render-build-portal] ${portal}: Clerk key ${clerkPk.slice(0, 12)}… (${clerkPk.length} chars)`
);

// Full monorepo install — scoped npm ci can miss hoisted deps on Render's clean checkouts.
run("npm ci --include=dev");
run("npm run build --workspace=@sompacare/shared");
// Run next build directly so we don't compile @sompacare/shared twice via the
// portal package.json build script (Render builds were OOMing on recruiter).
run("npx next build", { cwd: path.join(root, "apps", portal) });

const nextDir = path.join(root, "apps", portal, ".next");
if (!fs.existsSync(nextDir)) {
  console.error(`Build finished but missing ${nextDir}`);
  process.exit(1);
}

console.log(`\nRender build OK: @sompacare/${portal}`);
