import { PRODUCTION, RENDER_FALLBACK } from "./production-urls.mjs";

const useFallback = process.argv.includes("--render-fallback");
const urls = useFallback ? RENDER_FALLBACK : PRODUCTION;

const checks = [
  ["api-health", `${urls.apiV1}/health`],
  ["api-onboarding-status", `${urls.apiV1}/facility-onboarding/status`],
  ["api-onboarding-invite", `${urls.apiV1}/facility-onboarding/invite?token=bad`],
  ["api-unknown", `${urls.apiV1}/zzzz-not-a-route`],
  ["facility-onboarding", `${urls.facility}/onboarding`],
  ["facility-signup", `${urls.facility}/sign-up`],
  ["admin-sign-in", `${urls.admin}/sign-in`],
  ["admin-invite", `${urls.admin}/facilities/invite`],
];

async function probe(name, url) {
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(90_000) });
    return { name, status: res.status, url: res.url };
  } catch (e) {
    return { name, status: "ERR", error: e.message };
  }
}

async function chunkHasMarker(base, page, markers) {
  const html = await (await fetch(`${base}${page}`)).text();
  const paths = [...new Set([...html.matchAll(/\/_next\/static\/[^"']+\.js/g)].map((m) => m[0]))];
  for (const p of paths) {
    try {
      const js = await (await fetch(`${base}${p}`)).text();
      if (markers.some((m) => js.includes(m))) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

console.log(`=== Deploy Recheck (${useFallback ? "Render fallback" : "custom domains"}) ===\n`);
for (const [name, url] of checks) {
  const r = await probe(name, url);
  console.log(`${name}: ${r.status}${r.error ? ` (${r.error})` : ""}`);
}

console.log("\n=== New UI markers in JS bundles ===\n");
const facilityOnboarding = await chunkHasMarker(urls.facility, "/onboarding", [
  "Facility setup",
  "Accept your invitation",
  "completeFacilitySelfServiceOnboarding",
]);
const facilitySignup = await chunkHasMarker(urls.facility, "/sign-up", [
  "set up your organization",
  "/onboarding",
]);
const adminInvite = await chunkHasMarker(urls.admin, "/sign-in", [
  "Invite facility manager",
  "inviteFacilityManager",
  "/facilities/invite",
]);

console.log(`facility onboarding wizard deployed: ${facilityOnboarding ? "YES" : "NO"}`);
console.log(`facility signup redirect copy deployed: ${facilitySignup ? "YES" : "NO"}`);
console.log(`admin invite UI deployed: ${adminInvite ? "YES" : "NO"}`);

console.log("\n=== Interpretation ===");
const statusCode = (await probe("x", `${urls.apiV1}/facility-onboarding/status`)).status;
const unknownCode = (await probe("x", `${urls.apiV1}/zzzz-not-a-route`)).status;
if (statusCode === 401) console.log("API onboarding routes: LIVE (401 without auth is expected)");
else if (statusCode === 404 && unknownCode === 404) console.log("API onboarding routes: NOT DEPLOYED YET (404 same as unknown route)");
else console.log(`API onboarding routes: status=${statusCode} (check Render API deploy)`);
