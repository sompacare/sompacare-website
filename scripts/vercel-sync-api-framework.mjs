#!/usr/bin/env node
/** sompacare-api: monorepo root + build command on Vercel. */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scope = process.env.VERCEL_SCOPE ?? "sompacare-staffing";
const project = "sompacare-api";
const dir = "apps/api";
const installCommand = "cd ../.. && npm install";
const buildCommand = "cd ../.. && node scripts/vercel-build-api.mjs";

function vercelToken() {
  if (process.env.VERCEL_TOKEN?.trim()) return process.env.VERCEL_TOKEN.trim();
  const candidates = [
    path.join(process.env.APPDATA ?? "", "com.vercel.cli", "auth.json"),
    path.join(process.env.APPDATA ?? "", "xdg.data", "com.vercel.cli", "auth.json"),
    path.join(process.env.HOME ?? process.env.USERPROFILE ?? "", ".local", "share", "com.vercel.cli", "auth.json"),
  ];
  for (const authPath of candidates) {
    if (!fs.existsSync(authPath)) continue;
    const auth = JSON.parse(fs.readFileSync(authPath, "utf8"));
    if (auth.token) return auth.token;
  }
  return null;
}

async function patchProject(body) {
  const token = vercelToken();
  if (!token) {
    console.warn("No Vercel token — set VERCEL_TOKEN or run vercel login.");
    return;
  }
  const getRes = await fetch(
    `https://api.vercel.com/v9/projects/${encodeURIComponent(project)}?teamId=${scope}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!getRes.ok) {
    console.warn(`Project ${project} not found (${getRes.status}): ${await getRes.text()}`);
    return;
  }
  const meta = await getRes.json();
  const patchRes = await fetch(`https://api.vercel.com/v9/projects/${meta.id}?teamId=${scope}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const patchText = await patchRes.text();
  if (!patchRes.ok) {
    console.warn(`Patch failed (${patchRes.status}): ${patchText}`);
  } else {
    console.log("Patched sompacare-api:", body, patchText.slice(0, 120));
  }
}

console.log(`Updating ${project}…`);
await patchProject({
  rootDirectory: dir,
  sourceFilesOutsideRootDirectory: true,
});
console.log("Set rootDirectory=apps/api and sourceFilesOutsideRootDirectory=true.");
console.log("Ensure GitHub repo is connected and Production Branch = platform (Vercel Dashboard).");
