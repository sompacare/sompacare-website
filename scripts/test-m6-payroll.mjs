/**
 * M6 smoke test: generate → approve → process pay run
 */
const API = process.env.API_URL ?? "http://localhost:4000/api/v1";
const FACILITY_TOKEN = "Bearer dev_dev_facility_mgr";
const NURSE_TOKEN = "Bearer dev_user_3GExGUcVAk8Z0FtKSQeVly1hX4K";

async function api(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  console.log("1. Approved timecards available…");
  const tcs = await api("/timecards?status=APPROVED&limit=10", {
    token: FACILITY_TOKEN,
  });
  console.log("   count:", tcs.data?.length ?? 0);

  console.log("2. Generate pay run…");
  let run;
  try {
    run = await api("/payroll/runs", {
      method: "POST",
      token: FACILITY_TOKEN,
      body: {},
    });
    console.log("   run:", run.id, "workers:", run.workerCount, "net:", run.totalNet);
  } catch (err) {
    if (String(err).includes("No approved timecards")) {
      console.log("   skipped — no approved timecards without pay run");
      return;
    }
    throw err;
  }

  console.log("3. Approve pay run…");
  run = await api(`/payroll/runs/${run.id}/approve`, {
    method: "POST",
    token: FACILITY_TOKEN,
  });
  console.log("   status:", run.status);

  console.log("4. Process payouts…");
  const processed = await api(`/payroll/runs/${run.id}/process`, {
    method: "POST",
    token: FACILITY_TOKEN,
  });
  console.log("   status:", processed.payRun?.status);

  console.log("5. Nurse wallet after payroll…");
  const wallet = await api("/wallet", { token: NURSE_TOKEN });
  console.log("   balance:", wallet.balance);

  console.log("6. Export CSV…");
  const exportRes = await fetch(`${API}/payroll/runs/${run.id}/export`, {
    headers: { Authorization: FACILITY_TOKEN },
  });
  const csv = await exportRes.text();
  console.log("   csv lines:", csv.split("\n").length);

  console.log("M6 smoke test passed.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
