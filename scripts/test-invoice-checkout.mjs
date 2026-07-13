/**
 * Real Stripe test: approve timecard → pay invoice → confirm with test card
 */
import Stripe from "stripe";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API = process.env.API_URL ?? "http://localhost:4000/api/v1";
const FACILITY_TOKEN = "Bearer dev_dev_facility_mgr";
const ADMIN_TOKEN = "Bearer dev_dev_admin";
const FACILITY_ID = "cmrct0uiq00iu1yz4bwr3q687";

function workerToken(clerkId) {
  return `Bearer dev_${clerkId}`;
}

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

const env = {
  ...loadEnv(path.join(repoRoot, ".env")),
  ...loadEnv(path.join(repoRoot, ".env.platform")),
  ...loadEnv(path.join(repoRoot, "packages", "database", ".env")),
};

async function api(pathname, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${pathname} → ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function ensureOpenInvoice() {
  let invoices = await api(`/invoices?facilityId=${FACILITY_ID}&status=SENT&limit=5`, {
    token: FACILITY_TOKEN,
  });
  if (invoices.data?.[0]) return invoices.data[0];

  console.log("No open invoice — creating one from a submitted timecard…");
  const timecards = await api(`/timecards?facilityId=${FACILITY_ID}&status=SUBMITTED&limit=5`, {
    token: FACILITY_TOKEN,
  });
  let timecard = timecards.data?.[0];

  if (!timecard) {
    const assignments = await api(`/assignments?facilityId=${FACILITY_ID}&status=CONFIRMED&limit=10`, {
      token: FACILITY_TOKEN,
    });
    const assignment = assignments.data?.find((a) => a.worker?.id);
    if (!assignment) throw new Error("No confirmed assignment with worker to clock");

    const nurse = await api(`/users/${assignment.worker.id}`, { token: ADMIN_TOKEN });
    const nurseToken = workerToken(nurse.data.clerkId);

    const coords = { latitude: 39.2904, longitude: -76.6122, accuracyMeters: 10 };
    console.log(`Clocking assignment ${assignment.id} as ${nurse.data.firstName}…`);
    await api(`/assignments/${assignment.id}/clock-in`, {
      method: "POST",
      token: nurseToken,
      body: coords,
    });
    const clockOut = await api(`/assignments/${assignment.id}/clock-out`, {
      method: "POST",
      token: nurseToken,
      body: coords,
    });
    timecard = clockOut.timecard;
  }

  if (!timecard?.id) throw new Error("Could not create a submitted timecard");
  console.log(`Approving timecard ${timecard.id}…`);
  await api(`/timecards/${timecard.id}/approve`, {
    method: "PATCH",
    token: FACILITY_TOKEN,
  });

  invoices = await api(`/invoices?facilityId=${FACILITY_ID}&status=SENT&limit=5`, {
    token: FACILITY_TOKEN,
  });
  if (!invoices.data?.[0]) throw new Error("Invoice not created after approval");
  return invoices.data[0];
}

async function main() {
  const secretKey = env.STRIPE_SECRET_KEY;
  if (!secretKey?.startsWith("sk_test_")) {
    throw new Error("Real test requires sk_test_ STRIPE_SECRET_KEY in .env.platform");
  }

  console.log("1. Ensure open invoice…");
  const invoice = await ensureOpenInvoice();
  console.log(`   ${invoice.invoiceNumber} — $${invoice.total}`);

  console.log("2. Create Stripe PaymentIntent…");
  const pay = await api(`/invoices/${invoice.id}/pay`, {
    method: "POST",
    token: FACILITY_TOKEN,
  });
  if (pay.devPaid) throw new Error("PAYMENTS_DEV_BYPASS is still enabled");
  console.log(`   paymentIntentId: ${pay.paymentIntentId}`);

  console.log("3. Confirm payment with Stripe test card…");
  const stripe = new Stripe(secretKey);
  const confirmed = await stripe.paymentIntents.confirm(pay.paymentIntentId, {
    payment_method: "pm_card_visa",
    return_url: "http://localhost:3002/schedule",
  });
  if (confirmed.status !== "succeeded") {
    throw new Error(`PaymentIntent status: ${confirmed.status}`);
  }
  console.log("   Stripe status: succeeded");

  console.log("4. Settle invoice via API confirm endpoint…");
  const result = await api(`/invoices/${invoice.id}/confirm`, {
    method: "POST",
    token: FACILITY_TOKEN,
    body: { paymentIntentId: pay.paymentIntentId },
  });
  console.log(`   API status: ${result.status}`);

  const list = await api(`/invoices?facilityId=${FACILITY_ID}&status=PAID&limit=3`, {
    token: FACILITY_TOKEN,
  });
  console.log(`5. Paid invoices for facility: ${list.data?.length ?? 0}`);
  console.log("Real Stripe invoice checkout test passed.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
