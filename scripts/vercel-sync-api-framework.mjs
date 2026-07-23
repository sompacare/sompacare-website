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
  const authPath = path.join(process.env.APPDATA ?? "", "com.vercel.cli", "auth.json");
  if (!fs.existsSync(authPath)) return null;
  return JSON.parse(fs.readFileSync(authPath, "utf8")).token ?? null;
}

async function patchProject(body) {
  const token = vercelToken();
  if (!token) return;
  const getRes = await fetch(
    `https://api.vercel.com/v9/projects/${encodeURIComponent(project)}?teamId=${scope}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!getRes.ok) {
    console.warn(`Project ${project} not found (${getRes.status}) — create via npm run vercel:setup-api first.`);
    return;
  }
  const meta = await getRes.json();
  const patchRes = await fetch(`https://api.vercel.com/v9/projects/${meta.id}?teamId=${scope}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!patchRes.ok) {
    console.warn(`Patch failed: ${await patchRes.text()}`);
  } else {
    console.log("Patched sompacare-api monorepo settings.");
  }
}

console.log(`Updating ${project}…`);
const installEscaped = installCommand.replace(/"/g, '\\"');
const buildEscaped = buildCommand.replace(/"/g, '\\"');
execSync(
  `npx vercel project update ${project} --scope ${scope} --framework null --install-command "${installEscaped}" --build-command "${buildEscaped}"`,
  { stdio: "inherit", cwd: root }
);
await patchProject({
  rootDirectory: dir,
  sourceFilesOutsideRootDirectory: true,
});
