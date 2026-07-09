/**
 * Copy RESEND_* vars from .env.local into root .env (platform API).
 * Does not print secret values.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseEnv(content) {
  const vars = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    vars[key] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

function upsertEnvFile(path, updates) {
  const lines = existsSync(path) ? readFileSync(path, "utf8").split(/\r?\n/) : [];
  const keys = new Set(Object.keys(updates));
  const out = [];

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
      out.push(`${key}=${updates[key]}`);
      keys.delete(key);
    } else {
      out.push(line);
    }
  }

  for (const key of keys) {
    out.push(`${key}=${updates[key]}`);
  }

  writeFileSync(path, out.join("\n").replace(/\n*$/, "\n"));
}

const localPath = join(root, ".env.local");
const platformPath = join(root, ".env");

if (!existsSync(localPath)) {
  console.error("Missing .env.local — add RESEND_API_KEY there first.");
  process.exit(1);
}

const local = parseEnv(readFileSync(localPath, "utf8"));
const apiKey = local.RESEND_API_KEY;
if (!apiKey || apiKey.includes("your_api_key")) {
  console.error("RESEND_API_KEY not configured in .env.local");
  process.exit(1);
}

const updates = {
  RESEND_API_KEY: apiKey,
  RESEND_FROM_EMAIL:
    local.RESEND_FROM_EMAIL ?? '"Sompacare <onboarding@resend.dev>"',
};

upsertEnvFile(platformPath, updates);
console.log("Synced RESEND_API_KEY and RESEND_FROM_EMAIL into .env");
