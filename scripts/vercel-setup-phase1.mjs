#!/usr/bin/env node
/**
 * Phase 1: create/link Vercel portal projects and deploy (requires `vercel login`).
 *
 * Env vars: reads docs/launch/vercel-portal.env.example keys from, in order:
 *   .env.vercel-portals (create from docs/launch/vercel-portal.env.example — gitignored)
 *   .env.platform.live
 *   .env.local
 *
 * Usage:
 *   node scripts/vercel-setup-phase1.mjs
 *   node scripts/vercel-setup-phase1.mjs --deploy-only
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scope = process.env.VERCEL_SCOPE ?? "sompacare-staffing";
const deployOnly = process.argv.includes("--deploy-only");

const PORTALS = [
  { project: "sompacare-admin", dir: "apps/admin-portal", portal: "admin-portal", stripe: false },
  { project: "sompacare-nurse", dir: "apps/nurse-portal", portal: "nurse-portal", stripe: true },
  { project: "sompacare-facility", dir: "apps/facility-portal", portal: "facility-portal", stripe: true },
  { project: "sompacare-recruiter", dir: "apps/recruiter-portal", portal: "recruiter-portal", stripe: false },
];

const ENV_KEYS = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL",
  "NEXT_PUBLIC_CLERK_IS_SATELLITE",
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
];

const DEFAULTS = {
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in",
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up",
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: "/home",
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: "/home",
  NEXT_PUBLIC_CLERK_IS_SATELLITE: "false",
  NEXT_PUBLIC_API_URL: "https://api.sompacare.com/api/v1",
};

function run(cmd, cwd = root) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit", env: process.env });
}

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

function loadPortalEnv() {
  const merged = { ...DEFAULTS };
  const files = [
    path.join(root, ".env.platform"),
    path.join(root, ".env.local"),
    path.join(root, ".env.vercel-portals"),
    path.join(root, ".env.platform.live"),
  ];
  for (const file of files) {
    Object.assign(merged, parseEnvFile(file));
  }
  if (!merged.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && merged.CLERK_PUBLISHABLE_KEY) {
    merged.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = merged.CLERK_PUBLISHABLE_KEY;
  }
  return merged;
}

function projectExists(name) {
  try {
    const out = execSync(`npx vercel project ls --scope ${scope}`, {
      cwd: root,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return out.includes(name);
  } catch {
    return false;
  }
}

function vercelToken() {
  if (process.env.VERCEL_TOKEN?.trim()) return process.env.VERCEL_TOKEN.trim();
  const authPath =
    process.env.VERCEL_AUTH_PATH ??
    path.join(process.env.APPDATA ?? "", "xdg.data", "com.vercel.cli", "auth.json");
  if (!fs.existsSync(authPath)) return null;
  const auth = JSON.parse(fs.readFileSync(authPath, "utf8"));
  return auth.token ?? null;
}

async function enableMonorepoRoot(project, rootDirectory) {
  const token = vercelToken();
  if (!token) {
    console.warn("No Vercel token — enable monorepo settings manually in project Settings.");
    return;
  }
  const listRes = await fetch(
    `https://api.vercel.com/v9/projects/${encodeURIComponent(project)}?teamId=sompacare-staffing`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!listRes.ok) {
    console.warn(`Could not fetch project ${project} (${listRes.status}).`);
    return;
  }
  const body = await listRes.json();
  const patchRes = await fetch(`https://api.vercel.com/v9/projects/${body.id}?teamId=sompacare-staffing`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rootDirectory: rootDirectory,
      sourceFilesOutsideRootDirectory: true,
    }),
  });
  if (!patchRes.ok) {
    const text = await patchRes.text();
    console.warn(`Monorepo patch failed for ${project}: ${patchRes.status} ${text}`);
  } else {
    console.log(`Monorepo root ${rootDirectory} + include outside root for ${project}.`);
  }
}

async function ensureProject({ project, dir }) {
  if (projectExists(project)) {
    console.log(`Project ${project} already exists.`);
  } else {
    run(`npx vercel project add ${project} --scope ${scope}`);
  }
  await enableMonorepoRoot(project, dir);
}

function pushEnv(project, env, withStripe) {
  for (const key of ENV_KEYS) {
    if (key === "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" && !withStripe) continue;
    const value = env[key]?.trim();
    if (!value) {
      if (key.startsWith("NEXT_PUBLIC_CLERK") || key === "CLERK_SECRET_KEY") {
        console.warn(`Skip ${project} env ${key} — not set locally.`);
      }
      continue;
    }
    const sensitive = key.includes("SECRET") || key.includes("STRIPE") || key.startsWith("CLERK_");
    const sensFlag = sensitive ? " --sensitive" : "";
    run(
      `npx vercel env add ${key} production${sensFlag} --force --yes --project ${project} --scope ${scope} --value "${value.replace(/"/g, '\\"')}"`,
      root
    );
  }
}

function linkAndDeploy({ project, dir }) {
  const appRoot = path.join(root, dir);
  run(`npx vercel link --project ${project} --yes --scope ${scope}`, appRoot);
  console.log(
    `\nProject ${project}: env configured. Trigger a Git deploy (recommended):\n` +
      `  git push origin platform\n` +
      `Or in Vercel: Project → Settings → Git → Connect Repository → sompacare-website, branch platform.\n` +
      `Local "vercel deploy" only uploads ${dir}/ — monorepo builds require Git-connected deploys.\n`
  );
}

async function main() {
  const env = loadPortalEnv();
  if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_")) {
    console.error(
      "\nMissing Clerk publishable key locally.\n" +
        "Create .env.vercel-portals from docs/launch/vercel-portal.env.example\n" +
        "(copy pk_live/sk_live from Render env group sompacare-portal-auth), then re-run.\n"
    );
    process.exit(1);
  }

  for (const portal of PORTALS) {
    if (!deployOnly) {
      await ensureProject(portal);
      pushEnv(portal.project, env, portal.stripe);
    }
    linkAndDeploy(portal);
  }

  console.log(
    "\nPhase 1 CLI setup complete.\n" +
      "1. Connect each new project to GitHub in Vercel (if not auto-linked).\n" +
      "2. git push origin platform — builds run on Vercel with full monorepo.\n" +
      "3. Add custom domains (Step C in PHASE-1-VERCEL-PORTALS.md).\n" +
      "4. Suspend Render portal services.\n"
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
