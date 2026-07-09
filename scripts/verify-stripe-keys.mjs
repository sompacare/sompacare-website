/**
 * Verify Stripe publishable + secret keys are valid and mode-matched.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(filePath) {
  if (!existsSync(filePath)) return {};
  const out = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function modeOf(key) {
  if (key?.startsWith("sk_live_") || key?.startsWith("pk_live_")) return "live";
  if (key?.startsWith("sk_test_") || key?.startsWith("pk_test_")) return "test";
  return "unknown";
}

const platform = loadEnv(path.join(repoRoot, ".env.platform"));
const nurseLocal = loadEnv(path.join(repoRoot, "apps", "nurse-portal", ".env.local"));
const nurseProd = loadEnv(path.join(repoRoot, "apps", "nurse-portal", ".env.production.local"));

const secretKey = platform.STRIPE_SECRET_KEY;
const publishableLocal = nurseLocal.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const publishableProd = nurseProd.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

console.log("=== Stripe Key Check ===\n");

if (!secretKey || secretKey.includes("PASTE_YOUR")) {
  console.log("Secret key:  MISSING or still placeholder in .env.platform");
} else {
  console.log(`Secret key:    ${modeOf(secretKey)} (${secretKey.slice(0, 12)}...)`);
}

if (publishableLocal) {
  console.log(`Publishable (local dev):  ${modeOf(publishableLocal)} (${publishableLocal.slice(0, 12)}...)`);
}
if (publishableProd) {
  console.log(`Publishable (production): ${modeOf(publishableProd)} (${publishableProd.slice(0, 12)}...)`);
}

const secretMode = modeOf(secretKey);
const pubMode = modeOf(publishableLocal);
if (secretMode !== "unknown" && pubMode !== "unknown" && secretMode !== pubMode) {
  console.log("\n⚠️  MISMATCH: API secret is", secretMode, "but nurse portal publishable is", pubMode);
  console.log("   Both must be test (local) or both live (production).");
}

if (secretKey && !secretKey.includes("PASTE_YOUR")) {
  console.log("\nTesting secret key against Stripe API...");
  try {
    const stripe = new Stripe(secretKey);
    const balance = await stripe.balance.retrieve();
    const account = await stripe.accounts.retrieve();
    console.log("✅ Secret key works");
    console.log(`   Account: ${account.settings?.dashboard?.display_name ?? account.email ?? account.id}`);
    console.log(`   Mode: ${balance.livemode ? "live" : "test"}`);
    console.log(`   Available balance: ${balance.available.map((b) => `${b.amount / 100} ${b.currency}`).join(", ") || "0"}`);
  } catch (e) {
    console.log("❌ Secret key failed:", e.message);
  }
}

const API = "http://localhost:4000/api/v1";
try {
  const health = await fetch(`${API}/health`);
  if (health.ok) {
    console.log("\nTesting API payment path (Stripe onboard)...");
    const onboard = await fetch(`${API}/workers/me/stripe/onboard`, {
      method: "POST",
      headers: {
        Authorization: "Bearer dev_dev_nurse_rn",
        "Content-Type": "application/json",
      },
    });
    const body = await onboard.json();
    if (onboard.ok && body.url) {
      console.log("✅ API Stripe integration works (onboard URL returned)");
      console.log(`   Connect URL starts with: ${body.url.slice(0, 40)}...`);
    } else {
      console.log("❌ API Stripe onboard failed:", body.message ?? JSON.stringify(body));
    }
  }
} catch (e) {
  console.log("\nAPI not reachable — start with: npm run dev:api");
}

console.log("\nDone.");
