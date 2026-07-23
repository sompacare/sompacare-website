#!/usr/bin/env node
/** Debug Vercel deployments + fetch build events. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const teamId = process.env.VERCEL_SCOPE ?? "sompacare-staffing";
const projects = ["sompacare-admin", "sompacare-nurse", "sompacare-facility", "sompacare-recruiter"];

function token() {
  if (process.env.VERCEL_TOKEN?.trim()) return process.env.VERCEL_TOKEN.trim();
  for (const authPath of [
    path.join(process.env.APPDATA ?? "", "com.vercel.cli", "auth.json"),
    path.join(process.env.USERPROFILE ?? "", ".local", "share", "com.vercel.cli", "auth.json"),
  ]) {
    if (!fs.existsSync(authPath)) continue;
    const auth = JSON.parse(fs.readFileSync(authPath, "utf8"));
    if (auth.token) return auth.token;
  }
  return null;
}

const t = token();
if (!t) {
  console.error("No Vercel token");
  process.exit(1);
}

const headers = { Authorization: `Bearer ${t}` };

for (const name of projects) {
  console.log(`\n======== ${name} ========`);
  const proj = await fetch(`https://api.vercel.com/v9/projects/${name}?teamId=${teamId}`, { headers }).then((r) =>
    r.json()
  );
  console.log("root:", proj.rootDirectory, "framework:", proj.framework, "outside:", proj.sourceFilesOutsideRootDirectory);

  const deps = await fetch(
    `https://api.vercel.com/v6/deployments?projectId=${proj.id}&teamId=${teamId}&limit=3`,
    { headers }
  ).then((r) => r.json());

  for (const d of deps.deployments ?? []) {
    console.log(`  ${d.readyState} ${d.target} ${d.url} sha=${d.meta?.githubCommitSha?.slice(0, 7)} msg=${d.meta?.githubCommitMessage?.slice(0, 50)}`);
    if (d.readyState === "ERROR") {
      const ev = await fetch(`https://api.vercel.com/v2/deployments/${d.uid}/events?teamId=${teamId}&limit=80`, {
        headers,
      }).then((r) => r.json());
      const lines = (Array.isArray(ev) ? ev : ev.events ?? [])
        .map((e) => e.text ?? e.payload?.text ?? "")
        .filter(Boolean);
      for (const line of lines.slice(-15)) console.log("    |", line);
    }
  }
}
