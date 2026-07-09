/**
 * M12 Mobile Apps — config, push tokens, nurse/facility API surfaces, offline queue
 */
const API_BASE = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const API = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE}/api/v1`;
const NURSE = process.env.NURSE_TOKEN ?? "Bearer dev_dev_nurse_rn";
const FACILITY = process.env.FACILITY_TOKEN ?? "Bearer dev_dev_facility_mgr";

async function api(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: token },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  console.log("=== M12 Mobile Apps Test ===\n");

  const config = await api("/mobile/config");
  console.log("1. Mobile config (public)");
  console.log(`   offline queue: ${config.offlineClockQueue}`);
  console.log(`   biometric: ${config.biometricLogin}`);
  console.log(`   push: ${config.pushNotifications}`);

  const nursePush = await api("/mobile/push-token", {
    method: "POST",
    token: NURSE,
    body: { token: "ExponentPushToken[m12-nurse-test]", platform: "ios", app: "NURSE" },
  });
  console.log("\n2. Nurse push token registered");
  console.log(`   devBypass: ${nursePush.devBypass}`);

  const facilityPush = await api("/mobile/push-token", {
    method: "POST",
    token: FACILITY,
    body: { token: "ExponentPushToken[m12-facility-test]", platform: "android", app: "FACILITY" },
  });
  console.log("\n3. Facility push token registered");
  console.log(`   id: ${facilityPush.id}`);

  const shifts = await api("/shifts?limit=5&status=PUBLISHED", { token: NURSE });
  console.log("\n4. Nurse mobile feed");
  console.log(`   published shifts: ${shifts.data?.length ?? 0}`);

  const recs = await api("/ai/recommendations/shifts?limit=3", { token: NURSE });
  console.log("\n5. Nurse recommendations");
  console.log(`   recommendations: ${recs.recommendations?.length ?? 0}`);

  const assignments = await api("/assignments?limit=5", { token: NURSE });
  console.log("\n6. Nurse schedule");
  console.log(`   assignments: ${assignments.data?.length ?? 0}`);

  const wallet = await api("/wallet", { token: NURSE });
  console.log("\n7. Nurse wallet");
  console.log(`   balance: $${wallet.balance ?? 0}`);

  const apps = await api("/applications?limit=5&status=PENDING", { token: FACILITY });
  console.log("\n8. Facility applicants");
  console.log(`   pending: ${apps.data?.length ?? 0}`);

  const timecards = await api("/timecards?limit=5&status=SUBMITTED", { token: FACILITY });
  console.log("\n9. Facility timecards");
  console.log(`   submitted: ${timecards.data?.length ?? 0}`);

  console.log("\n✅ M12 mobile platform test passed");
}

main().catch((err) => {
  console.error("\n❌ M12 test failed:", err.message);
  process.exit(1);
});
