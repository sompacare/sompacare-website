/**
 * M5 smoke test: approve timecard → wallet credit + invoice → pay invoice
 */
const API = process.env.API_URL ?? "http://localhost:4000/api/v1";
const FACILITY_TOKEN = "Bearer dev_dev_facility_mgr";
const NURSE_TOKEN = process.env.NURSE_TOKEN ?? "Bearer dev_dev_nurse_rn";
const FACILITY_ID = "cmrct0uiq00iu1yz4bwr3q687";

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
  console.log("1. Find submitted timecard…");
  const tcs = await api(`/timecards?facilityId=${FACILITY_ID}&status=SUBMITTED&limit=5`, {
    token: FACILITY_TOKEN,
  });
  let timecard = tcs.data?.[0];
  if (!timecard) {
    console.log("   No submitted timecard — skipping approve step");
  } else {
    console.log("2. Approve timecard (credits wallet + creates invoice)…");
    await api(`/timecards/${timecard.id}/approve`, {
      method: "PATCH",
      token: FACILITY_TOKEN,
    });
    console.log("   approved:", timecard.id);
  }

  console.log("3. Nurse wallet balance…");
  const wallet = await api("/wallet", { token: NURSE_TOKEN });
  console.log("   balance:", wallet.balance);

  const tx = await api("/wallet/transactions?limit=5", { token: NURSE_TOKEN });
  console.log("   transactions:", tx.data?.length ?? 0);

  console.log("4. Facility invoices…");
  const invoices = await api(`/invoices?facilityId=${FACILITY_ID}&status=SENT&limit=5`, {
    token: FACILITY_TOKEN,
  });
  console.log("   open invoices:", invoices.data?.length ?? 0);

  if (invoices.data?.[0]) {
    console.log("5. Pay invoice (dev mode)…");
    const paid = await api(`/invoices/${invoices.data[0].id}/pay`, {
      method: "POST",
      token: FACILITY_TOKEN,
    });
    console.log("   devPaid:", paid.devPaid);
  }

  console.log("6. Stripe onboard (dev)…");
  const onboard = await api("/workers/me/stripe/onboard", {
    method: "POST",
    token: NURSE_TOKEN,
  });
  console.log("   devBypass:", onboard.devBypass);

  console.log("M5 smoke test passed.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
