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
process.env.NODE_OPTIONS = process.env.NODE_OPTIONS ?? "--max-old-space-size=4096";

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: process.env });
}

run("npm ci --include=dev");
run("npm run build --workspace=@sompacare/shared");
run(`npm run build --workspace=@sompacare/${portal}`);

const nextDir = path.join(root, "apps", portal, ".next");
if (!fs.existsSync(nextDir)) {
  console.error(`Build finished but missing ${nextDir}`);
  process.exit(1);
}

console.log(`\nRender build OK: @sompacare/${portal}`);
