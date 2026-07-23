#!/usr/bin/env node
/** Print DB/Supabase host hints only (no secrets). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readKey(file, key) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) return null;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    if (!t.startsWith(`${key}=`)) continue;
    let val = t.slice(key.length + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    return val;
  }
  return null;
}

function hostOf(urlStr, label) {
  if (!urlStr) return `${label}: (not set)`;
  try {
    const u = new URL(urlStr);
    return `${label}: ${u.hostname}:${u.port || "(default)"}`;
  } catch {
    return `${label}: (invalid URL)`;
  }
}

console.log(hostOf(readKey(".env.platform.live", "DATABASE_URL"), "platform.live DATABASE_URL"));
console.log(hostOf(readKey(".env.platform", "DATABASE_URL"), "platform DATABASE_URL"));
console.log(hostOf(readKey(".env.local", "NEXT_PUBLIC_SUPABASE_URL"), "local Supabase URL"));
console.log(
  "SUPABASE_SERVICE_ROLE_KEY set:",
  Boolean(readKey(".env.local", "SUPABASE_SERVICE_ROLE_KEY"))
);
