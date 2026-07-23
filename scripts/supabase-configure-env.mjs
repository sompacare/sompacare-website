#!/usr/bin/env node
/**
 * Build Supabase Postgres URIs from project ref + password; probe pooler region.
 * Writes/updates .env.platform.live (gitignored) — never logs secrets.
 *
 * Usage:
 *   set SUPABASE_DB_PASSWORD=...   (Dashboard → Database → password)
 *   node scripts/supabase-configure-env.mjs
 *
 * Optional: SUPABASE_PROJECT_REF (default from NEXT_PUBLIC_SUPABASE_URL)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const livePath = path.join(root, ".env.platform.live");

const REGIONS = [
  "us-east-1",
  "us-west-1",
  "us-west-2",
  "eu-west-1",
  "eu-central-1",
  "ap-southeast-1",
];

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

function projectRefFromEnv() {
  if (process.env.SUPABASE_PROJECT_REF?.trim()) return process.env.SUPABASE_PROJECT_REF.trim();
  const local = parseEnvFile(path.join(root, ".env.local"));
  const url = local.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    const m = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

function encodePassword(password) {
  return encodeURIComponent(password);
}

function buildUrls(ref, password, region) {
  const enc = encodePassword(password);
  const direct = `postgresql://postgres.${ref}:${enc}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
  const pooler = `postgresql://postgres.${ref}:${enc}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`;
  return { direct, pooler, region };
}

async function tryConnect(connectionString, timeoutMs = 8000) {
  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: timeoutMs,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    await client.query("SELECT 1");
    await client.end();
    return true;
  } catch {
    try {
      await client.end();
    } catch {
      /* ignore */
    }
    return false;
  }
}

async function detectRegion(ref, password) {
  for (const region of REGIONS) {
    const { direct } = buildUrls(ref, password, region);
    process.stdout.write(`Probing pooler region ${region}… `);
    const ok = await tryConnect(direct);
    console.log(ok ? "OK" : "fail");
    if (ok) return region;
  }
  const enc = encodePassword(password);
  const legacyDirect = `postgresql://postgres:${enc}@db.${ref}.supabase.co:5432/postgres`;
  process.stdout.write("Probing direct db.*.supabase.co… ");
  if (await tryConnect(legacyDirect)) {
    console.log("OK");
    return "legacy-direct";
  }
  console.log("fail");
  return null;
}

function upsertEnvLines(existingText, updates) {
  const lines = existingText.split(/\r?\n/);
  const keys = new Set(Object.keys(updates));
  const out = [];
  const seen = new Set();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      out.push(line);
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      out.push(line);
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    if (keys.has(key)) {
      out.push(`${key}="${updates[key].replace(/"/g, '\\"')}"`);
      seen.add(key);
    } else {
      out.push(line);
    }
  }

  for (const [key, val] of Object.entries(updates)) {
    if (!seen.has(key)) out.push(`${key}="${val.replace(/"/g, '\\"')}"`);
  }

  return `${out.join("\n").replace(/\n+$/, "")}\n`;
}

async function main() {
  const live = parseEnvFile(livePath);
  const renderSource =
    live.RENDER_DATABASE_URL ||
    (live.DATABASE_URL?.includes("render.com") ? live.DATABASE_URL : "");

  let password = process.env.SUPABASE_DB_PASSWORD?.trim();
  if (!password) {
    password = live.SUPABASE_DB_PASSWORD?.trim();
  }
  if (!password && renderSource) {
    try {
      password = decodeURIComponent(new URL(renderSource).password);
      console.log("Trying database password from RENDER_DATABASE_URL / Render DATABASE_URL…");
    } catch {
      /* ignore */
    }
  }
  if (!password) {
    console.error(
      "Set SUPABASE_DB_PASSWORD (Supabase Dashboard → Project Settings → Database → password)."
    );
    process.exit(1);
  }

  const ref = projectRefFromEnv();
  if (!ref) {
    console.error("Could not resolve project ref from NEXT_PUBLIC_SUPABASE_URL in .env.local");
    process.exit(1);
  }

  if (!renderSource) {
    console.error("Add Render DATABASE_URL to .env.platform.live first (copy source for pg_dump).");
    process.exit(1);
  }

  console.log(`Supabase project ref: ${ref}`);
  const region = await detectRegion(ref, password);
  if (!region) {
    console.error("Could not connect to Supabase Postgres — check password and network.");
    process.exit(1);
  }

  let direct;
  let pooler;
  if (region === "legacy-direct") {
    const enc = encodePassword(password);
    direct = `postgresql://postgres:${enc}@db.${ref}.supabase.co:5432/postgres`;
    pooler = `postgresql://postgres.${ref}:${enc}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`;
  } else {
    ({ direct, pooler } = buildUrls(ref, password, region));
  }

  const existing = fs.existsSync(livePath) ? fs.readFileSync(livePath, "utf8") : "";
  const merged = upsertEnvLines(existing, {
    RENDER_DATABASE_URL: renderSource,
    DIRECT_DATABASE_URL: direct,
    DATABASE_URL: pooler,
  });
  fs.writeFileSync(livePath, merged, "utf8");
  console.log("\nUpdated .env.platform.live (RENDER_DATABASE_URL, DIRECT_DATABASE_URL, DATABASE_URL).");
  console.log("Run: npm run supabase:cutover:migrate");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
