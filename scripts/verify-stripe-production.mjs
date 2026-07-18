import { PRODUCTION } from "./production-urls.mjs";

/**
 * Verify production portals baked Stripe publishable key mode (live vs test).
 * Does not print full keys — only mode summary.
 */
const portals = [
  { name: "nurse", url: PRODUCTION.nurse, pages: ["/sign-in", "/"] },
  {
    name: "facility",
    url: PRODUCTION.facility,
    pages: ["/sign-in", "/payroll", "/"],
  },
];

function modeFromContent(content) {
  const hasLive = /pk_live_/.test(content);
  const hasTest = /pk_test_/.test(content);
  const hasStripeJs = /loadStripe|@stripe\/stripe-js|NEXT_PUBLIC_STRIPE/.test(content);
  if (hasLive && !hasTest) return { mode: "live", hasStripeJs };
  if (hasTest && !hasLive) return { mode: "test", hasStripeJs };
  if (hasLive && hasTest) return { mode: "mixed", hasStripeJs };
  return { mode: "none", hasStripeJs };
}

async function checkPortal({ name, url, pages }) {
  const scriptPaths = new Set();
  const pageStatuses = [];

  for (const page of pages) {
    try {
      const res = await fetch(`${url}${page}`, { signal: AbortSignal.timeout(90_000) });
      const html = await res.text();
      pageStatuses.push(`${page}:${res.status}`);
      for (const match of html.matchAll(/\/_next\/static\/[^"']+\.js/g)) {
        scriptPaths.add(match[0]);
      }
    } catch (e) {
      pageStatuses.push(`${page}:ERROR`);
    }
  }

  const htmlMode = { mode: "skipped" };
  const uniqueScripts = [...scriptPaths].slice(0, 80);

  let stripeLive = false;
  let stripeTest = false;
  let clerkLive = false;
  let clerkTest = false;
  let jsStripe = false;
  let chunksChecked = 0;

  let sompacareLivePrefix = false;
  let sompacareTestPrefix = false;

  for (const path of uniqueScripts) {
    chunksChecked++;
    try {
      const res = await fetch(`${url}${path}`, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) continue;
      const js = await res.text();
      if (/pk_live_51TrLFRE/.test(js)) sompacareLivePrefix = true;
      if (/pk_test_51TrLFRE/.test(js)) sompacareTestPrefix = true;
      if (/loadStripe|NEXT_PUBLIC_STRIPE/.test(js)) jsStripe = true;

      for (const match of js.matchAll(/loadStripe\(["'](pk_(?:live|test)_[^"']+)["']\)/g)) {
        if (match[1].startsWith("pk_live_")) stripeLive = true;
        else stripeTest = true;
      }
      for (const match of js.matchAll(/(pk_(?:live|test)_[A-Za-z0-9]{20,})/g)) {
        const key = match[1];
        const idx = match.index ?? 0;
        const context = js.slice(Math.max(0, idx - 80), idx + key.length + 80);
        if (/STRIPE|loadStripe|stripe/i.test(context)) {
          if (key.startsWith("pk_live_")) stripeLive = true;
          else stripeTest = true;
        }
        if (/CLERK|clerk|publishableKey/i.test(context)) {
          if (key.startsWith("pk_live_")) clerkLive = true;
          else clerkTest = true;
        }
      }
    } catch {
      /* ignore chunk fetch errors */
    }
  }

  let jsMode = "none";
  if (stripeLive && !stripeTest) jsMode = "live";
  else if (stripeTest && !stripeLive) jsMode = "test";
  else if (stripeLive && stripeTest) jsMode = "mixed";

  let clerkMode = "unknown";
  if (clerkLive && !clerkTest) clerkMode = "live";
  else if (clerkTest && !clerkLive) clerkMode = "test";
  else if (clerkLive && clerkTest) clerkMode = "mixed";

  return {
    name,
    pages: pageStatuses.join(", "),
    htmlPkMode: htmlMode.mode,
    htmlNote:
      htmlMode.mode === "test" && htmlMode.hasStripeJs === false
        ? "pk_test likely Clerk auth key on sign-in (not Stripe)"
        : undefined,
    jsChunksChecked: chunksChecked,
    bakedStripePkMode: jsMode,
    sompacareStripeLiveKeyBaked: sompacareLivePrefix,
    sompacareStripeTestKeyBaked: sompacareTestPrefix,
    clerkPkMode: clerkMode,
    stripeJsPresent: jsStripe,
  };
}

console.log("=== Production Stripe Portal Check ===\n");

for (const portal of portals) {
  try {
    const result = await checkPortal(portal);
    console.log(`${result.name}:`);
    console.log(`  pages: ${result.pages}`);
    console.log(`  HTML pk mode: ${result.htmlPkMode}${result.htmlNote ? ` (${result.htmlNote})` : ""}`);
    console.log(`  JS bundles checked: ${result.jsChunksChecked}`);
    console.log(`  Baked Stripe pk mode in JS: ${result.bakedStripePkMode}`);
    console.log(`  Sompacare live Stripe key baked: ${result.sompacareStripeLiveKeyBaked ? "yes" : "no"}`);
    console.log(`  Sompacare test Stripe key baked: ${result.sompacareStripeTestKeyBaked ? "yes" : "no"}`);
    console.log(`  Clerk pk mode in JS: ${result.clerkPkMode}`);
    console.log(`  Stripe.js usage in bundles: ${result.stripeJsPresent ? "yes" : "no"}`);
    console.log("");
  } catch (e) {
    console.log(`${portal.name}: ERROR — ${e.message}\n`);
  }
}

try {
  const webhook = await fetch(`${PRODUCTION.apiV1}/payments/stripe/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
    signal: AbortSignal.timeout(60_000),
  });
  const body = await webhook.text();
  let apiNote = `HTTP ${webhook.status}`;
  if (body.includes("devBypass")) apiNote += " — payments dev bypass ON";
  else if (body.includes("STRIPE_WEBHOOK_SECRET not configured")) apiNote += " — webhook secret missing";
  else if (webhook.status === 500) apiNote += " — Stripe active (unsigned probe rejected)";
  console.log(`api webhook probe: ${apiNote}`);
} catch (e) {
  console.log(`api webhook probe: ERROR — ${e.message}`);
}

console.log("\nDone.");

async function scanAllStaticChunks(base, label) {
  const html = await (await fetch(`${base}/sign-in`)).text();
  const buildId = html.match(/\/_next\/static\/([^/]+)\//)?.[1];
  console.log(`\n${label}: buildId=${buildId ?? "unknown"}`);

  // Scan every referenced JS chunk plus common app chunks from the build output.
  const paths = new Set([...html.matchAll(/\/_next\/static\/[^"']+\.js/g)].map((m) => m[0]));

  // Next.js app router often stores route chunks under static/chunks/app
  for (let i = 0; i < 30; i++) {
    paths.add(`/_next/static/chunks/app/layout-${i}.js`);
  }

  let live = false;
  let test = false;
  let checked = 0;
  for (const p of paths) {
    checked++;
    try {
      const res = await fetch(`${base}${p}`, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) continue;
      const js = await res.text();
      if (/pk_live_51TrLFRE/.test(js)) live = true;
      if (/pk_test_51TrLFRE/.test(js)) test = true;
    } catch {
      /* ignore */
    }
  }
  console.log(`${label}: scanned ${checked} chunk URLs — live Stripe key: ${live ? "yes" : "no"}, test Stripe key: ${test ? "yes" : "no"}`);
}

await scanAllStaticChunks(PRODUCTION.facility, "facility");
await scanAllStaticChunks(PRODUCTION.nurse, "nurse");
