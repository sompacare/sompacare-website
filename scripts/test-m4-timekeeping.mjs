/**
 * Quick M4 smoke test: clock-in → clock-out → list timecard → approve
 */
const API = process.env.API_URL ?? "http://localhost:4000/api/v1";
const NURSE_TOKEN = process.env.NURSE_TOKEN ?? "Bearer dev_user_3GExGUcVAk8Z0FtKSQeVly1hX4K";
const FACILITY_TOKEN = process.env.FACILITY_TOKEN ?? "Bearer dev_dev_facility_mgr";
const ASSIGNMENT_ID = process.env.ASSIGNMENT_ID ?? "cmrcwmxfd00031yysiloe1pdu";
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

async function main() {
  console.log("1. Clock in…");
  const clockIn = await api(`/assignments/${ASSIGNMENT_ID}/clock-in`, {
    method: "POST",
    token: NURSE_TOKEN,
    body: coords,
  });
  console.log("   status:", clockIn.assignment?.status);

  console.log("2. Clock out…");
  const clockOut = await api(`/assignments/${ASSIGNMENT_ID}/clock-out`, {
    method: "POST",
    token: NURSE_TOKEN,
    body: coords,
  });
  console.log("   status:", clockOut.assignment?.status);
  console.log("   timecard:", clockOut.timecard?.id, clockOut.timecard?.status);

  const timecardId = clockOut.timecard?.id;
  if (!timecardId) throw new Error("No timecard created");

  console.log("3. Facility lists submitted timecards…");
  const list = await api(
    `/timecards?facilityId=${FACILITY_ID}&status=SUBMITTED&limit=5`,
    { token: FACILITY_TOKEN }
  );
  console.log("   count:", list.data?.length);

  console.log("4. Approve timecard…");
  const approved = await api(`/timecards/${timecardId}/approve`, {
    method: "PATCH",
    token: FACILITY_TOKEN,
  });
  console.log("   status:", approved.status);
  console.log("M4 smoke test passed.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
