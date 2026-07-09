/**
 * M10 Real-time — WebSocket, notification center, jobs, SMS/push dev bypass
 */
const API_BASE = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const API = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE}/api/v1`;
const WS_URL = API_BASE.replace(/\/api\/v1$/, "");
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

async function testSocket(token) {
  const { io } = await import("socket.io-client");
  return new Promise((resolve, reject) => {
    const raw = token.replace("Bearer ", "");
    const socket = io(`${WS_URL}/realtime`, {
      auth: { token: raw },
      transports: ["websocket"],
      timeout: 5000,
    });
    const timer = setTimeout(() => {
      socket.disconnect();
      reject(new Error("Socket connection timeout"));
    }, 8000);

    socket.on("connect", () => {
      clearTimeout(timer);
      socket.disconnect();
      resolve(true);
    });
    socket.on("connect_error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function main() {
  console.log("=== M10 Real-time Test ===\n");

  // 1. WebSocket connect
  await testSocket(NURSE);
  console.log("1. WebSocket connected (nurse)");

  // 2. Baseline unread counts
  const nurseUnreadBefore = await api("/notifications/unread-count", { token: NURSE });
  const facilityUnreadBefore = await api("/notifications/unread-count", { token: FACILITY });
  console.log("\n2. Unread baseline");
  console.log(`   nurse: ${nurseUnreadBefore.count}`);
  console.log(`   facility: ${facilityUnreadBefore.count}`);

  // 3. Create + publish shift to trigger reminders
  const facilities = await api("/facilities?limit=1", { token: FACILITY });
  const facility = facilities.data?.[0];
  const locationId = facility?.locations?.[0]?.id ?? "seed-location-fox-chase";
  const suffix = Date.now().toString().slice(-4);

  const draft = await api("/shifts", {
    method: "POST",
    token: FACILITY,
    body: {
      facilityId: facility.id,
      locationId,
      title: `M10 Realtime Test ${suffix}`,
      role: "RN",
      shiftType: "PER_DIEM",
      hourlyRate: 55,
      startTime: new Date(Date.now() + 86400000 * 2).toISOString(),
      endTime: new Date(Date.now() + 86400000 * 2 + 43200000).toISOString(),
      isEmergency: true,
      slotsTotal: 1,
    },
  });

  const published = await api(`/shifts/${draft.id}/publish`, { method: "POST", token: FACILITY });
  console.log("\n3. Published shift (triggers realtime + urgent notify)");
  console.log(`   ${published.title} → ${published.status}`);

  // 4. Nurse applies → facility notification
  try {
    await api(`/shifts/${draft.id}/applications`, {
      method: "POST",
      token: NURSE,
      body: { message: `M10 test apply ${suffix}` },
    });
  } catch (e) {
    if (!String(e.message).includes("already applied")) throw e;
  }
  console.log("\n4. Nurse applied to shift");

  // 5. Notification lists
  const facilityNotifs = await api("/notifications?limit=5", { token: FACILITY });
  const nurseNotifs = await api("/notifications?limit=5", { token: NURSE });
  console.log("\n5. Notification feed");
  console.log(`   facility latest: ${facilityNotifs[0]?.title ?? "none"}`);
  console.log(`   nurse latest: ${nurseNotifs[0]?.title ?? "none"}`);

  const facilityUnreadAfter = await api("/notifications/unread-count", { token: FACILITY });
  const nurseUnreadAfter = await api("/notifications/unread-count", { token: NURSE });
  console.log(`   facility unread: ${facilityUnreadAfter.count}`);
  console.log(`   nurse unread: ${nurseUnreadAfter.count}`);

  // 6. Mark all read
  const marked = await api("/notifications/read-all", { method: "POST", token: FACILITY });
  console.log("\n6. Mark all read (facility)");
  console.log(`   updated: ${marked.updated}`);

  console.log("\n✅ M10 Real-time test passed");
}

main().catch((err) => {
  console.error("\n❌ M10 test failed:", err.message);
  process.exit(1);
});
