/**
 * Full E2E flow:
 * Nurse clock-in/out → facility approve timecard → payroll process →
 * nurse wallet → facility pay invoice → nurse instant pay
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API_BASE = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const API = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE}/api/v1`;
const NURSE_TOKEN = process.env.NURSE_TOKEN ?? "Bearer dev_dev_nurse_rn";
const FACILITY_TOKEN = process.env.FACILITY_TOKEN ?? "Bearer dev_dev_facility_mgr";
const FACILITY_ID = process.env.FACILITY_ID ?? "cmrct0uiq00iu1yz4bwr3q687";
const coords = { latitude: 39.2904, longitude: -76.6122, accuracyMeters: 10 };

async function api(path, { method = "GET", token, body } = {}) {
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
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function findConfirmedAssignment() {
  if (process.env.ASSIGNMENT_ID) {
    return api(`/assignments/${process.env.ASSIGNMENT_ID}`, { token: NURSE_TOKEN });
  }
  const list = await api("/assignments?limit=20", { token: NURSE_TOKEN });
  const confirmed = list.data?.find((a) => a.status === "CONFIRMED");
  if (!confirmed) throw new Error("No CONFIRMED assignment — post/approve a shift first");
  return confirmed;
}

/** Backdate clock-out so payroll has non-zero hours (instant API clock-out = 0h). */
async function seedWorkedHours(assignmentId, hoursWorked = 8) {
  const assignment = await prisma.shiftAssignment.findUniqueOrThrow({
    where: { id: assignmentId },
    include: {
      shift: true,
      clockEvents: true,
      timecard: true,
    },
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
  console.log(`   seeded ${regularHours}h worked → gross $${grossAmount}`);
}

async function main() {
  console.log("=== Full E2E Flow ===\n");

  // ── 1. Nurse: clock in / out ──────────────────────────────────────────
  const assignment = await findConfirmedAssignment();
  console.log(`1. Nurse clock-in on assignment ${assignment.id} (${assignment.shift?.title})…`);
  const clockIn = await api(`/assignments/${assignment.id}/clock-in`, {
    method: "POST",
    token: NURSE_TOKEN,
    body: coords,
  });
  console.log("   assignment status:", clockIn.assignment?.status);

  console.log("2. Nurse clock-out…");
  const clockOut = await api(`/assignments/${assignment.id}/clock-out`, {
    method: "POST",
    token: NURSE_TOKEN,
    body: coords,
  });
  const timecardId = clockOut.timecard?.id;
  console.log("   assignment status:", clockOut.assignment?.status);
  console.log("   timecard:", timecardId, clockOut.timecard?.status);
  if (!timecardId) throw new Error("No timecard created on clock-out");

  console.log("   (dev) backdate clock-out to 8h shift…");
  await seedWorkedHours(assignment.id, 8);

  // ── 2. Facility: approve timecard ─────────────────────────────────────
  console.log("3. Facility approve timecard…");
  const approved = await api(`/timecards/${timecardId}/approve`, {
    method: "PATCH",
    token: FACILITY_TOKEN,
  });
  console.log("   timecard status:", approved.status);

  // ── 3. Facility: payroll (M6 — wallet credit happens here) ──────────────
  console.log("4. Facility generate pay run…");
  let run = await api("/payroll/runs", {
    method: "POST",
    token: FACILITY_TOKEN,
    body: {},
  });
  console.log("   run:", run.id, "workers:", run.workerCount, "net:", run.totalNet);

  console.log("5. Facility approve pay run…");
  run = await api(`/payroll/runs/${run.id}/approve`, {
    method: "POST",
    token: FACILITY_TOKEN,
  });
  console.log("   status:", run.status);

  console.log("6. Facility process payouts…");
  const processed = await api(`/payroll/runs/${run.id}/process`, {
    method: "POST",
    token: FACILITY_TOKEN,
  });
  console.log("   status:", processed.payRun?.status);

  // ── 4. Nurse: wallet balance + EARNING ──────────────────────────────────
  console.log("7. Nurse wallet balance…");
  const wallet = await api("/wallet", { token: NURSE_TOKEN });
  console.log("   balance:", wallet.balance);

  const tx = await api("/wallet/transactions?limit=10", { token: NURSE_TOKEN });
  const earnings = tx.data?.filter((t) => t.type === "EARNING") ?? [];
  console.log("   EARNING transactions:", earnings.length);
  if (earnings[0]) {
    console.log("   latest EARNING:", earnings[0].amount, earnings[0].description);
  }
  if (Number(wallet.balance) <= 0) {
    throw new Error("Wallet balance is 0 after payroll process");
  }

  // ── 5. Facility: pay invoice ────────────────────────────────────────────
  console.log("8. Facility list open invoices…");
  const invoices = await api(`/invoices?facilityId=${FACILITY_ID}&status=SENT&limit=5`, {
    token: FACILITY_TOKEN,
  });
  console.log("   open invoices:", invoices.data?.length ?? 0);
  if (!invoices.data?.[0]) {
    throw new Error("No SENT invoice found after timecard approve");
  }
  const invoice = invoices.data[0];
  console.log("9. Facility pay invoice…");
  const paid = await api(`/invoices/${invoice.id}/pay`, {
    method: "POST",
    token: FACILITY_TOKEN,
  });
  console.log("   invoice status:", paid.status ?? paid.devPaid ?? "paid");

  // ── 6. Nurse: Stripe onboard + instant pay ──────────────────────────────
  console.log("10. Nurse set up payouts (Stripe onboard)…");
  const onboard = await api("/workers/me/stripe/onboard", {
    method: "POST",
    token: NURSE_TOKEN,
  });
  console.log("   stripeOnboarded:", onboard.stripeOnboarded ?? onboard.devBypass);

  const balanceBefore = Number(wallet.balance);
  const instantAmount = Math.min(balanceBefore, 50);
  console.log(`11. Nurse instant pay ($${instantAmount})…`);
  const payout = await api("/wallet/instant-pay", {
    method: "POST",
    token: NURSE_TOKEN,
    body: { amount: instantAmount },
  });
  console.log("   new balance:", payout.balance ?? payout.newBalance);

  const walletAfter = await api("/wallet", { token: NURSE_TOKEN });
  console.log("   final balance:", walletAfter.balance);

  console.log("\n=== Full E2E flow passed ===");
}

main().catch((err) => {
  console.error("\nFAILED:", err.message);
  process.exitCode = 1;
});
