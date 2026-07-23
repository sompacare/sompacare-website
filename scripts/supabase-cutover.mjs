#!/usr/bin/env node
/**
 * Layer 1 — Supabase Postgres cutover helper.
 *
 * Requires in .env.platform.live (gitignored):
 *   RENDER_DATABASE_URL     — current Render Postgres (source), OR omit and use DATABASE_URL if still Render
 *   DIRECT_DATABASE_URL     — Supabase direct/session (port 5432) for migrate + pg_restore
 *   DATABASE_URL            — Supabase transaction pooler (port 6543) for Vercel API
 *
 * Usage:
 *   node scripts/env-db-hosts.mjs          # sanity check hosts (no secrets)
 *   node scripts/supabase-cutover.mjs check
 *   node scripts/supabase-cutover.mjs migrate
 *   node scripts/supabase-cutover.mjs verify-pooler
 *
 * Data copy (needs pg_dump/pg_restore — use GitHub Action on Windows):
 *   node scripts/supabase-cutover.mjs data-migrate   # prints workflow instructions if no pg_dump
 */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cmd = process.argv[2] ?? "check";

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
  const merged = {};
  for (const file of [".env.platform", ".env.platform.live", ".env.vercel-api"]) {
    Object.assign(merged, parseEnvFile(path.join(root, file)));
  }
  return merged;
}

function hostHint(urlStr) {
  if (!urlStr) return "(unset)";
  try {
    const u = new URL(urlStr);
    return `${u.hostname}:${u.port || "5432"}`;
  } catch {
    return "(invalid)";
  }
}

function isRenderDb(url) {
  return url?.includes("render.com") ?? false;
}

function isSupabasePooler(url) {
  return url?.includes("pooler.supabase.com") && url?.includes("6543");
}

function isSupabaseDirect(url) {
  return (
    url?.includes("supabase.co") ||
    (url?.includes("pooler.supabase.com") && url?.includes(":5432"))
  );
}

function run(cmdStr, env = {}) {
  console.log(`> ${cmdStr}`);
  execSync(cmdStr, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
}

function hasPgDump() {
  const r = spawnSync("pg_dump", ["--version"], { encoding: "utf8" });
  return r.status === 0;
}

const env = loadEnv();
const renderSource =
  env.RENDER_DATABASE_URL?.trim() ||
  (isRenderDb(env.DATABASE_URL) ? env.DATABASE_URL : "");
const direct = env.DIRECT_DATABASE_URL?.trim();
const pooler = isSupabasePooler(env.DATABASE_URL) ? env.DATABASE_URL.trim() : "";

if (cmd === "check") {
  console.log("=== Layer 1 env check (hosts only) ===\n");
  console.log("Render source:", hostHint(renderSource), renderSource ? "" : "(set RENDER_DATABASE_URL)");
  console.log("Supabase direct (5432):", hostHint(direct));
  console.log("Supabase pooler (6543):", hostHint(pooler || env.DATABASE_URL));
  console.log("pg_dump installed:", hasPgDump());

  const issues = [];
  if (!direct || !isSupabaseDirect(direct)) {
    issues.push("Add DIRECT_DATABASE_URL — Supabase Dashboard → Database → Connection string → URI (direct, port 5432).");
  }
  if (!pooler && !isSupabasePooler(env.DATABASE_URL)) {
    issues.push(
      "Set DATABASE_URL to Transaction pooler (port 6543) with ?pgbouncer=true&connection_limit=1"
    );
  }
  if (!renderSource && !direct) {
    issues.push("Need RENDER_DATABASE_URL (or Render DATABASE_URL) before data copy.");
  }

  if (issues.length) {
    console.log("\nNext steps:");
    for (const i of issues) console.log(`  • ${i}`);
    process.exit(issues.some((x) => x.includes("Add DIRECT")) ? 1 : 0);
  }
  console.log("\nEnv looks ready for migrate + verify. Run: node scripts/supabase-cutover.mjs migrate");
  process.exit(0);
}

if (cmd === "migrate") {
  if (!direct) {
    console.error("Missing DIRECT_DATABASE_URL in .env.platform.live");
    process.exit(1);
  }
  run("npm run db:generate --workspace=@sompacare/database");
  run("npm run db:migrate:deploy --workspace=@sompacare/database", {
    DATABASE_URL: direct,
    DIRECT_DATABASE_URL: direct,
  });
  run("npm run db:seed:roles --workspace=@sompacare/database", {
    DATABASE_URL: direct,
    DIRECT_DATABASE_URL: direct,
  });
  console.log("\nSchema migrated on Supabase. Copy data next (data-migrate or GitHub Action).");
  process.exit(0);
}

if (cmd === "verify-pooler") {
  const url = pooler || env.DATABASE_URL;
  if (!url?.includes("postgres")) {
    console.error("Set DATABASE_URL to Supabase pooler in .env.platform.live");
    process.exit(1);
  }
  run("node scripts/verify-db-pooler.mjs", {
    DATABASE_URL: url,
    DIRECT_DATABASE_URL: direct || url,
  });
  process.exit(0);
}

if (cmd === "data-migrate") {
  if (!renderSource || !direct) {
    console.error("Need RENDER_DATABASE_URL (or Render DATABASE_URL) and DIRECT_DATABASE_URL");
    process.exit(1);
  }
  if (!hasPgDump()) {
    console.log(`
No pg_dump on this machine. Use GitHub Actions:

  1. Repo Settings → Secrets → Actions:
     RENDER_DATABASE_URL  (Render external DB URL)
     SUPABASE_DIRECT_URL  (Supabase direct 5432 URI)

  2. Actions → "Supabase data migrate" → Run workflow

  Or install PostgreSQL client tools and re-run:
     node scripts/supabase-cutover.mjs data-migrate
`);
    process.exit(1);
  }
  const dumpPath = path.join(root, "sompacare-render.dump");
  run(`pg_dump "${renderSource.replace(/"/g, '\\"')}" --no-owner --no-acl -F c -f "${dumpPath}"`);
  run(`pg_restore -d "${direct.replace(/"/g, '\\"')}" --no-owner --no-acl --clean --if-exists "${dumpPath}"`);
  console.log("\nData copy done. Run verify-pooler, then npm run vercel:sync-api-env and redeploy API.");
  process.exit(0);
}

console.error(`Unknown command: ${cmd}`);
console.error("Commands: check | migrate | verify-pooler | data-migrate");
process.exit(1);
