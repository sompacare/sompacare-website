#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function parse(f) {
  const o = {};
  for (const line of fs.readFileSync(path.join(root, f), "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    o[t.slice(0, i).trim()] = v;
  }
  return o;
}

async function list(label, url) {
  const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const r = await c.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1"
  );
  console.log(`${label}: ${r.rows.length} tables —`, r.rows.slice(0, 15).map((x) => x.tablename).join(", "));
  await c.end();
}

const live = parse(".env.platform.live");
await list("Render", live.RENDER_DATABASE_URL);
await list("Supabase", live.DIRECT_DATABASE_URL);
