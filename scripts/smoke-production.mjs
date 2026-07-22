#!/usr/bin/env node
/**
 * Production smoke checks — API health + portal auth entry points.
 * Usage: node scripts/smoke-production.mjs
 */
import { PRODUCTION } from "./production-urls.mjs";

const PORTALS = [
  { name: "nurse", base: PRODUCTION.nurse },
  { name: "facility", base: PRODUCTION.facility },
  { name: "recruiter", base: PRODUCTION.recruiter },
  { name: "admin", base: PRODUCTION.admin },
];

const BAD_HTML_MARKERS = [
  "Application error: a client-side exception",
  "Portal not configured",
  "Missing publishableKey",
];

async function probe(label, url, { expectRedirect = false } = {}) {
  const res = await fetch(url, { redirect: expectRedirect ? "manual" : "follow" });
  const ok =
    expectRedirect
      ? res.status >= 300 && res.status < 400
      : res.status >= 200 && res.status < 400;

  return { label, url, status: res.status, ok, body: ok && !expectRedirect ? await res.text() : "" };
}

async function main() {
  const results = [];

  const healthRes = await fetch(`${PRODUCTION.apiV1}/health`);
  const healthOk = healthRes.ok;
  let healthBody = {};
  try {
    healthBody = await healthRes.json();
  } catch {
    healthBody = {};
  }
  const dbOk = healthBody?.services?.database === "up" || healthBody?.status === "healthy";
  results.push({
    label: "api health",
    url: `${PRODUCTION.apiV1}/health`,
    status: healthRes.status,
    ok: healthOk && (healthBody.status === "healthy" || healthBody.status === "degraded"),
  });
  results.push({
    label: "api database",
    url: `${PRODUCTION.apiV1}/health`,
    status: healthRes.status,
    ok: dbOk,
  });

  for (const portal of PORTALS) {
    const signIn = await probe(`${portal.name} sign-in`, `${portal.base}/sign-in`);
    if (signIn.body) {
      const bad = BAD_HTML_MARKERS.find((m) => signIn.body.includes(m));
      if (bad) {
        signIn.ok = false;
        signIn.detail = `HTML contains: ${bad}`;
      } else if (!signIn.body.includes("clerk") && !signIn.body.includes("Sign in")) {
        signIn.ok = false;
        signIn.detail = "sign-in page missing expected Clerk/sign-in content";
      }
    }
    results.push(signIn);

    results.push(await probe(`${portal.name} sign-up`, `${portal.base}/sign-up`));
    results.push(
      await probe(`${portal.name} /home (guest)`, `${portal.base}/home`, { expectRedirect: true })
    );
  }

  results.push(await probe("marketing www", PRODUCTION.marketing));
  results.push(await probe("marketing privacy", `${PRODUCTION.marketing}/privacy`));
  results.push(await probe("marketing terms", `${PRODUCTION.marketing}/terms`));

  let failed = 0;
  for (const row of results) {
    const mark = row.ok ? "OK" : "FAIL";
    if (!row.ok) failed += 1;
    const extra = row.detail ? ` (${row.detail})` : "";
    console.log(`${mark} ${row.status} ${row.label} — ${row.url}${extra}`);
  }

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed.`);
    process.exit(1);
  }

  console.log(`\nAll ${results.length} checks passed. Production entry points look ready.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
