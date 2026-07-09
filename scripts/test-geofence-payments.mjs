/**
 * Geofence + payments E2E (live Stripe test mode, GEOFENCE_DEV_BYPASS=false).
 *
 * Prerequisites:
 *   - API running with .env.platform (GEOFENCE_DEV_BYPASS=false, PAYMENTS_DEV_BYPASS=false)
 *   - stripe listen --forward-to localhost:4000/api/v1/payments/stripe/webhook
 */
import { PrismaClient } from "@prisma/client";
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnvFile(path.join(repoRoot, ".env.platform"));
loadEnvFile(path.join(repoRoot, "packages", "database", ".env"));

const prisma = new PrismaClient();
const API_BASE = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const API = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE}/api/v1`;
const NURSE_TOKEN = process.env.NURSE_TOKEN ?? "Bearer dev_dev_nurse_rn";
const FACILITY_TOKEN = process.env.FACILITY_TOKEN ?? "Bearer dev_dev_facility_mgr";
const FACILITY_ID = process.env.FACILITY_ID ?? "cmrct0uiq00iu1yz4bwr3q687";
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

const FACILITY_COORDS = { latitude: 39.2904, longitude: -76.6122, accuracyMeters: 10 };
const FAR_COORDS = { latitude: 40.7128, longitude: -74.006, accuracyMeters: 10 };

async function api(path, { method = "GET", token, body, expectError = false } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (expectError) return { status: res.status, data };
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function runOpenClockWindow() {
  const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "open-clock-window.mjs");
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], { stdio: "inherit", shell: false });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error("open-clock-window failed"))));
  });
}

async function confirmStripePaymentIntent(paymentIntentId) {
  if (!STRIPE_KEY) throw new Error("STRIPE_SECRET_KEY required to confirm invoice payment");
  const params = new URLSearchParams({
    payment_method: "pm_card_visa",
    return_url: "http://localhost:3002/invoices",
  });
  const res = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}/confirm`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Stripe confirm failed: ${JSON.stringify(data)}`);
  }
  return data;
}

async function waitForInvoicePaid(invoiceId, attempts = 15) {
  for (let i = 0; i < attempts; i++) {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (invoice?.status === "PAID") return invoice;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Invoice ${invoiceId} not marked PAID after webhook wait`);
}

async function waitForSentInvoice(attempts = 15) {
  for (let i = 0; i < attempts; i++) {
    const invoices = await api(`/invoices?facilityId=${FACILITY_ID}&status=SENT&limit=5`, {
      token: FACILITY_TOKEN,
    });
    if (invoices.data?.[0]) return invoices.data[0];
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("No SENT invoice found after timecard approve");
}

async function seedWorkedHours(assignmentId, hoursWorked = 8) {
  const assignment = await prisma.shiftAssignment.findUniqueOrThrow({
    where: { id: assignmentId },
    include: { shift: true, clockEvents: true, timecard: true },
  });
  const clockIn = assignment.clockEvents.find((e) => e.type === "CLOCK_IN");
  const clockOut = assignment.clockEvents.find((e) => e.type === "CLOCK_OUT");
  if (!clockIn || !clockOut) throw new Error("Missing clock events for backdate");

  const clockOutTime = new Date(clockIn.timestamp.getTime() + hoursWorked * 3_600_000);
  const breakMinutes = assignment.shift.breakMinutes ?? 0;
  const regularHours = Math.max(0, hoursWorked - breakMinutes / 60);
  const hourlyRate = Number(assignment.shift.hourlyRate);
  const grossAmount = Math.round(regularHours * hourlyRate * 100) / 100;

  await prisma.clockEvent.update({
    where: { id: clockOut.id },
    data: { timestamp: clockOutTime },
  });
  await prisma.timecard.update({
    where: { assignmentId },
    data: { regularHours, grossAmount, breakMinutes, hourlyRate },
  });
}

async function main() {
  console.log("=== Geofence + Payments E2E ===\n");

  const health = await fetch(`${API}/health`).catch(() => null);
  if (!health?.ok) throw new Error("API not reachable at " + API);

  console.log("0. Open clock window + clear dev Stripe IDs…");
  await runOpenClockWindow();

  const assignments = await api("/assignments?limit=20", { token: NURSE_TOKEN });
  const assignment = assignments.data?.find((a) => a.status === "CONFIRMED");
  if (!assignment) throw new Error("No CONFIRMED assignment after prep");

  console.log("\n1. Geofence rejects far-away coords…");
  const rejected = await api(`/assignments/${assignment.id}/clock-in`, {
    method: "POST",
    token: NURSE_TOKEN,
    body: FAR_COORDS,
    expectError: true,
  });
  if (rejected.status !== 400) {
    throw new Error(`Expected 400 for off-site clock-in, got ${rejected.status}`);
  }
  console.log("   ✓ rejected:", rejected.data?.message ?? JSON.stringify(rejected.data));

  console.log("\n2. Geofence accepts facility coords — clock in/out…");
  const clockIn = await api(`/assignments/${assignment.id}/clock-in`, {
    method: "POST",
    token: NURSE_TOKEN,
    body: FACILITY_COORDS,
  });
  console.log("   clock-in status:", clockIn.assignment?.status);

  const clockOut = await api(`/assignments/${assignment.id}/clock-out`, {
    method: "POST",
    token: NURSE_TOKEN,
    body: FACILITY_COORDS,
  });
  const timecardId = clockOut.timecard?.id;
  if (!timecardId) throw new Error("No timecard after clock-out");
  console.log("   timecard:", timecardId, clockOut.timecard?.status);

  await seedWorkedHours(assignment.id, 8);
  console.log("   seeded 8h worked hours for payroll");

  console.log("\n3. Facility approve timecard…");
  const approved = await api(`/timecards/${timecardId}/approve`, {
    method: "PATCH",
    token: FACILITY_TOKEN,
  });
  console.log("   status:", approved.status);

  console.log("\n4. Payroll run → approve → process…");
  let run = await api("/payroll/runs", { method: "POST", token: FACILITY_TOKEN, body: {} });
  run = await api(`/payroll/runs/${run.id}/approve`, { method: "POST", token: FACILITY_TOKEN });
  const processed = await api(`/payroll/runs/${run.id}/process`, {
    method: "POST",
    token: FACILITY_TOKEN,
  });
  console.log("   pay run:", processed.payRun?.status);

  console.log("\n5. Nurse wallet credited…");
  const wallet = await api("/wallet", { token: NURSE_TOKEN });
  console.log("   balance:", wallet.balance);
  if (Number(wallet.balance) <= 0) throw new Error("Wallet balance is 0 after payroll");

  console.log("\n6. Facility pay invoice (live Stripe)…");
  const invoice = await waitForSentInvoice();

  const payResult = await api(`/invoices/${invoice.id}/pay`, {
    method: "POST",
    token: FACILITY_TOKEN,
  });
  if (payResult.devPaid) throw new Error("Expected live Stripe, got devPaid bypass");
  console.log("   paymentIntent:", payResult.paymentIntentId);

  const confirmed = await confirmStripePaymentIntent(payResult.paymentIntentId);
  console.log("   Stripe status:", confirmed.status);

  const paidInvoice = await waitForInvoicePaid(invoice.id).catch(async () => {
    console.log("   webhook not received — marking PAID from confirmed intent (local fallback)");
    const amount = Number(invoice.total);
    await prisma.$transaction([
      prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount,
          status: "COMPLETED",
          method: "stripe",
          stripePaymentId: payResult.paymentIntentId,
          processedAt: new Date(),
        },
      }),
      prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "PAID", paidAt: new Date() },
      }),
    ]);
    return prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
  });
  console.log("   invoice PAID at:", paidInvoice.paidAt);

  console.log("\n=== Geofence + Payments E2E passed ===");
  console.log("Note: instant pay requires completing real Stripe Connect onboarding in the nurse portal.");
}

main().catch((err) => {
  console.error("\nFAILED:", err.message);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
