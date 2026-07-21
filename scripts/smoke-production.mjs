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

async function probe(label, url, { expectRedirect = false } = {}) {
  const res = await fetch(url, { redirect: expectRedirect ? "manual" : "follow" });
  const ok =
    expectRedirect
      ? res.status >= 300 && res.status < 400
      : res.status >= 200 && res.status < 400;

  return { label, url, status: res.status, ok };
}

async function main() {
  const results = [];

  results.push(await probe("api health", `${PRODUCTION.apiV1}/health`));

  for (const portal of PORTALS) {
    results.push(await probe(`${portal.name} sign-in`, `${portal.base}/sign-in`));
    results.push(await probe(`${portal.name} sign-up`, `${portal.base}/sign-up`));
    results.push(
      await probe(`${portal.name} /home (guest)`, `${portal.base}/home`, { expectRedirect: true })
    );
  }

  results.push(await probe("marketing www", PRODUCTION.marketing));

  let failed = 0;
  for (const row of results) {
    const mark = row.ok ? "OK" : "FAIL";
    if (!row.ok) failed += 1;
    console.log(`${mark} ${row.status} ${row.label} — ${row.url}`);
  }

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed.`);
    process.exit(1);
  }

  console.log(`\nAll ${results.length} checks passed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
