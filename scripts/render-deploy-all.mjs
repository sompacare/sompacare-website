#!/usr/bin/env node
/**
 * Trigger Render deploys for Sompacare (sequential — saves build pipeline contention).
 *
 * Setup (once):
 *   Render Dashboard → Account Settings → API Keys → Create API key
 *
 * Usage:
 *   set RENDER_API_KEY=rnd_...   (PowerShell: $env:RENDER_API_KEY="rnd_...")
 *   node scripts/render-deploy-all.mjs
 *   node scripts/render-deploy-all.mjs --clear-cache
 *   node scripts/render-deploy-all.mjs --only api
 */
const API = "https://api.render.com/v1";

const DEPLOY_ORDER = [
  "sompacare-api",
  "sompacare-admin",
  "sompacare-nurse",
  "sompacare-facility",
  "sompacare-recruiter",
];

const args = process.argv.slice(2);
const clearCache = args.includes("--clear-cache");
const onlyIdx = args.indexOf("--only");
const only =
  onlyIdx >= 0 && args[onlyIdx + 1]
    ? args[onlyIdx + 1].toLowerCase()
    : null;

const ONLY_MAP = {
  api: "sompacare-api",
  admin: "sompacare-admin",
  nurse: "sompacare-nurse",
  facility: "sompacare-facility",
  recruiter: "sompacare-recruiter",
};

async function api(path, options = {}) {
  const key = process.env.RENDER_API_KEY?.trim();
  if (!key) {
    console.error(
      "Missing RENDER_API_KEY.\n" +
        "Create one at Render → Account Settings → API Keys, then:\n" +
        '  PowerShell: $env:RENDER_API_KEY="rnd_..."\n' +
        "  node scripts/render-deploy-all.mjs"
    );
    process.exit(1);
  }

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} → ${res.status}: ${text}`);
  }
  return body;
}

async function listServices() {
  const names = new Set(DEPLOY_ORDER);
  const found = new Map();
  let cursor;

  do {
    const q = new URLSearchParams({ limit: "100" });
    if (cursor) q.set("cursor", cursor);
    const page = await api(`/services?${q}`);
    for (const item of page ?? []) {
      const svc = item.service ?? item;
      if (svc?.name && names.has(svc.name)) {
        found.set(svc.name, svc.id);
      }
    }
    cursor = page.cursor?.next;
  } while (cursor && found.size < names.size);

  return found;
}

async function triggerDeploy(serviceId, serviceName) {
  const body = clearCache ? { clearCache: "clear" } : { clearCache: "do_not_clear" };
  const deploy = await api(`/services/${serviceId}/deploys`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const id = deploy.id ?? deploy.deploy?.id ?? "(unknown)";
  console.log(`Started deploy for ${serviceName} → deploy id ${id}`);
}

async function main() {
  let order = DEPLOY_ORDER;
  if (only) {
    const full = ONLY_MAP[only];
    if (!full) {
      console.error(`Unknown --only value. Use: ${Object.keys(ONLY_MAP).join(", ")}`);
      process.exit(1);
    }
    order = [full];
  }

  console.log("Fetching Render services…");
  const byName = await listServices();

  for (const name of order) {
    const id = byName.get(name);
    if (!id) {
      console.error(`Service not found in Render workspace: ${name}`);
      process.exit(1);
    }
    await triggerDeploy(id, name);
  }

  console.log(
    "\nDeploy(s) queued. Watch progress in Render → each service → Deploys.\n" +
      "When all are Live, run: npm run smoke:production"
  );
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
