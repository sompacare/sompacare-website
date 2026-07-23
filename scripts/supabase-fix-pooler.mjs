#!/usr/bin/env node
/** Find working Supabase transaction pooler region; updates DATABASE_URL in .env.platform.live */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const livePath = path.join(root, ".env.platform.live");

const REGIONS = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "eu-west-1",
  "eu-west-2",
  "eu-central-1",
  "eu-central-2",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-south-1",
  "sa-east-1",
  "ca-central-1",
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

function upsertKey(text, key, value) {
  const lines = text.split(/\r?\n/);
  let found = false;
  const out = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      found = true;
      return `${key}="${value.replace(/"/g, '\\"')}"`;
    }
    return line;
  });
  if (!found) out.push(`${key}="${value.replace(/"/g, '\\"')}"`);
  return `${out.join("\n").replace(/\n+$/, "")}\n`;
}

const live = parseEnvFile(livePath);
const direct = live.DIRECT_DATABASE_URL;
if (!direct?.includes("supabase")) {
  console.error("Missing DIRECT_DATABASE_URL in .env.platform.live");
  process.exit(1);
}

const ref = "erpnoiulwhcctuzcsthg";
const du = new URL(direct);
const password = decodeURIComponent(du.password);
const enc = encodeURIComponent(password);

for (const region of REGIONS) {
  const pooler = `postgresql://postgres.${ref}:${enc}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`;
  const client = new pg.Client({
    connectionString: pooler,
    connectionTimeoutMillis: 8000,
    ssl: { rejectUnauthorized: false },
  });
  process.stdout.write(`6543 ${region}… `);
  try {
    await client.connect();
    await client.query("SELECT 1");
    await client.end();
    console.log("OK");
    const text = fs.readFileSync(livePath, "utf8");
    fs.writeFileSync(livePath, upsertKey(text, "DATABASE_URL", pooler), "utf8");
    console.log("Updated DATABASE_URL pooler in .env.platform.live");
    process.exit(0);
  } catch {
    console.log("fail");
    try {
      await client.end();
    } catch {
      /* ignore */
    }
  }
}

console.error("No pooler region matched — using direct connection for Vercel (add ?connection_limit=1).");
const directWithLimit = direct.includes("?")
  ? `${direct}&connection_limit=1`
  : `${direct}?connection_limit=1`;
const text = fs.readFileSync(livePath, "utf8");
fs.writeFileSync(livePath, upsertKey(text, "DATABASE_URL", directWithLimit), "utf8");
console.log("Updated DATABASE_URL to Supabase direct (session) for serverless.");
process.exit(0);
