#!/usr/bin/env node
/** Compare row counts on Render vs Supabase (hosts only in logs). */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

async function countUsers(label, url) {
  if (!url) return console.log(`${label}: (no url)`);
  const host = new URL(url).hostname;
  const client = new pg.Client({
    connectionString: url,
    connectionTimeoutMillis: 15000,
    ssl: url.includes("supabase") ? { rejectUnauthorized: false } : undefined,
  });
  try {
    await client.connect();
    const r = await client.query(
      `SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User'`
    );
    const hasUser = r.rows[0]?.n > 0;
    let count = null;
    if (hasUser) {
      const u = await client.query('SELECT COUNT(*)::int AS n FROM "User"');
      count = u.rows[0]?.n;
    }
    console.log(`${label} (${host}): User table=${hasUser}, rows=${count ?? "n/a"}`);
  } catch (e) {
    console.log(`${label} (${host}): error ${e.message}`);
  } finally {
    await client.end().catch(() => {});
  }
}

const live = parseEnvFile(path.join(root, ".env.platform.live"));
await countUsers("Render", live.RENDER_DATABASE_URL);
await countUsers("Supabase direct", live.DIRECT_DATABASE_URL);
await countUsers("Supabase pooler", live.DATABASE_URL);
