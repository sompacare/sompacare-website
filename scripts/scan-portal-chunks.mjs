import { PRODUCTION } from "./production-urls.mjs";

const base = process.argv[2] ?? PRODUCTION.facility;
const page = process.argv[3] ?? "/sign-in";

const res = await fetch(`${base}${page}`, { redirect: "follow" });
const html = await res.text();
console.log(`${base}${page} -> ${res.status} (${res.url})`);

const paths = [...new Set([...html.matchAll(/\/_next\/static\/[^"'\s)]+\.js/g)].map((m) => m[0]))];
console.log(`script refs: ${paths.length}`);

let live = 0;
let test = 0;
let emptyLoadStripe = 0;
for (const p of paths) {
  const jsRes = await fetch(`${base}${p}`);
  if (!jsRes.ok) continue;
  const js = await jsRes.text();
  if (/pk_live_51TrLFRE/.test(js)) {
    live++;
    console.log("LIVE key in", p);
  }
  if (/pk_test_51TrLFRE/.test(js)) {
    test++;
    console.log("TEST key in", p);
  }
  if (/loadStripe\([\"'][\"']\)/.test(js) || /loadStripe\(\"\"\)/.test(js)) {
    emptyLoadStripe++;
    console.log("empty loadStripe in", p);
  }
  if (/Stripe is not configured/.test(js)) {
    console.log("stripe-not-configured UI in", p);
  }
}
console.log(`summary: live=${live} test=${test} emptyLoadStripe=${emptyLoadStripe}`);
