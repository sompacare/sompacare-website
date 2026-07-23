#!/usr/bin/env node
/**
 * Reset Vercel portal projects to Next.js + vercel.json build settings (monorepo).
 * Run after Git deploys fail with Framework "Other" / wrong output directory.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scope = process.env.VERCEL_SCOPE ?? "sompacare-staffing";
const teamId = scope;

const PORTALS = [
  { project: "sompacare-admin", dir: "apps/admin-portal" },
  { project: "sompacare-nurse", dir: "apps/nurse-portal" },
  { project: "sompacare-facility", dir: "apps/facility-portal" },
  { project: "sompacare-recruiter", dir: "apps/recruiter-portal" },
];

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

async function patchProject(project, body) {
  const token = vercelToken();
  if (!token) {
    console.warn("No Vercel token — skip API patch.");
    return;
  }
  const getRes = await fetch(
    `https://api.vercel.com/v9/projects/${encodeURIComponent(project)}?teamId=${teamId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!getRes.ok) {
    console.warn(`Could not fetch ${project}: ${getRes.status}`);
    return;
  }
  const meta = await getRes.json();
  const patchRes = await fetch(`https://api.vercel.com/v9/projects/${meta.id}?teamId=${teamId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!patchRes.ok) {
    console.warn(`Patch ${project} failed: ${patchRes.status} ${await patchRes.text()}`);
  } else {
    console.log(`Patched ${project}:`, body);
  }
}

for (const { project, dir } of PORTALS) {
  console.log(`\nUpdating ${project}…`);
  execSync(
    `npx vercel project update ${project} --scope ${scope} --framework nextjs --auto-detect build-command --auto-detect install-command --auto-detect output-directory`,
    { stdio: "inherit", cwd: root }
  );
  await patchProject(project, {
    rootDirectory: dir,
    sourceFilesOutsideRootDirectory: true,
  });
}

console.log("\nDone. Push to platform to redeploy production.");
