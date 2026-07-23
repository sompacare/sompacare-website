#!/usr/bin/env node
/** Smoke-test a Vercel API deployment URL (preview or production). */
const base = process.argv[2];
if (!base) {
  console.error("Usage: node scripts/smoke-api-url.mjs https://your-api.vercel.app");
  process.exit(1);
}
const url = `${base.replace(/\/$/, "")}/api/v1/health`;
const res = await fetch(url);
const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  json = null;
}
const dbOk = json?.services?.database === "ok";
const ok =
  res.ok &&
  json &&
  (json.status === "ok" || json.status === "degraded") &&
  dbOk;
console.log(ok ? "OK" : "FAIL", res.status, url);
if (json) console.log(JSON.stringify(json));
process.exit(ok ? 0 : 1);
