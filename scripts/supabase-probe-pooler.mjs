#!/usr/bin/env node
/** Find IPv4-compatible Supabase session pooler URL for GitHub Actions. */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ref = "erpnoiulwhcctuzcsthg";
const REGIONS = ["us-east-1", "us-east-2", "us-west-1", "us-west-2", "eu-west-1", "eu-central-1"];

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

const direct = parse(".env.platform.live").DIRECT_DATABASE_URL;
const pass = decodeURIComponent(new URL(direct).password);
const enc = encodeURIComponent(pass);

async function tryUrl(label, url) {
  const c = new pg.Client({ connectionString: url, connectionTimeoutMillis: 8000, ssl: { rejectUnauthorized: false } });
  try {
    await c.connect();
    await c.query("select 1");
    console.log("OK", label, new URL(url).hostname);
    await c.end();
    return url;
  } catch (e) {
    console.log("fail", label, e.message.split("\n")[0].slice(0, 80));
    try {
      await c.end();
    } catch {}
    return null;
  }
}

for (const region of REGIONS) {
  const u1 = `postgresql://postgres.${ref}:${enc}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
  const u2 = `postgresql://postgres:${enc}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
  if (await tryUrl(`${region} postgres.ref`, u1)) process.exit(0);
  if (await tryUrl(`${region} postgres`, u2)) process.exit(0);
}
console.log("No IPv4 pooler found");
process.exit(1);
