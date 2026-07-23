#!/usr/bin/env node
/**
 * Set GitHub Actions secrets and dispatch Supabase data migrate workflow.
 * Requires: gh auth login (repo scope)
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = process.env.GITHUB_REPO ?? "sompacare/sompacare-website";

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

function gh(args) {
  execSync(`gh ${args}`, { cwd: root, stdio: "inherit", env: process.env, shell: true });
}

function setSecret(name, value) {
  if (!value?.trim()) {
    console.error(`Missing value for secret ${name}`);
    process.exit(1);
  }
  const tmp = path.join(root, `.gh-secret-${name}.tmp`);
  fs.writeFileSync(tmp, value, "utf8");
  try {
    const body = fs.readFileSync(tmp, "utf8");
    execSync(`gh secret set ${name} --repo ${repo} --body ${JSON.stringify(body)}`, {
      cwd: root,
      stdio: "inherit",
      shell: true,
    });
  } finally {
    fs.unlinkSync(tmp);
  }
  console.log(`Set secret ${name}`);
}

try {
  execSync("gh auth status", { stdio: "pipe" });
} catch {
  console.error("Run: gh auth login  (GitHub.com, HTTPS, repo scope)");
  process.exit(1);
}

const live = parseEnvFile(path.join(root, ".env.platform.live"));
const render = live.RENDER_DATABASE_URL?.trim();
const supabaseDirect = live.DIRECT_DATABASE_URL?.trim();

if (!render?.includes("render.com")) {
  console.error("Missing RENDER_DATABASE_URL in .env.platform.live");
  process.exit(1);
}
if (!supabaseDirect?.includes("supabase")) {
  console.error("Missing DIRECT_DATABASE_URL in .env.platform.live");
  process.exit(1);
}

setSecret("RENDER_DATABASE_URL", render);
setSecret("SUPABASE_DIRECT_URL", supabaseDirect);
setSecret("DATABASE_URL", supabaseDirect);

console.log("\nDispatching Supabase data migrate workflow…");
gh(`workflow run supabase-data-migrate.yml --repo ${repo} --ref platform`);

console.log("\nWatch progress: gh run watch --repo " + repo);
