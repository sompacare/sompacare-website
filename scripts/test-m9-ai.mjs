/**
 * M9 AI Engine — shift matching, recommendations, anomalies, compliance risks
 */
const API_BASE = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const API = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE}/api/v1`;
const NURSE = process.env.NURSE_TOKEN ?? "Bearer dev_dev_nurse_rn";
const FACILITY = process.env.FACILITY_TOKEN ?? "Bearer dev_dev_facility_mgr";
const ADMIN = process.env.ADMIN_TOKEN ?? "Bearer dev_dev_admin";

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
  console.log("=== M9 AI Engine Test ===\n");

  // 1. Ensure a published RN shift exists
  let shifts = await api("/shifts?status=PUBLISHED&role=RN&limit=10", { token: FACILITY });
  let shift = shifts.data?.find((s) => s.role === "RN");

  if (!shift) {
    const facilities = await api("/facilities?limit=5", { token: FACILITY });
    const facility = facilities.data?.[0];
    if (!facility) throw new Error("No facility found");

    const locationId = facility.locations?.[0]?.id ?? "seed-location-fox-chase";
    const created = await api("/shifts", {
      method: "POST",
      token: FACILITY,
      body: {
        facilityId: facility.id,
        locationId,
        title: `RN — M9 AI Test ${Date.now().toString().slice(-4)}`,
        description: "M9 smoke test shift",
        role: "RN",
        shiftType: "PER_DIEM",
        hourlyRate: 54,
        startTime: new Date(Date.now() + 86400000 * 3).toISOString(),
        endTime: new Date(Date.now() + 86400000 * 3 + 43200000).toISOString(),
        requirements: ["Med-Surg", "BLS"],
        slotsTotal: 2,
      },
    });
    shift = await api(`/shifts/${created.id}/publish`, { method: "POST", token: FACILITY });
  }

  if (!shift) throw new Error("Could not find or create RN shift");
  console.log("1. Target shift");
  console.log(`   ${shift.title} (${shift.role})`);

  // 2. AI-ranked worker matches
  const matches = await api(`/shifts/${shift.id}/matches`, { token: FACILITY });
  console.log("\n2. Shift AI matches");
  console.log(`   total matches: ${matches.total}`);
  console.log(`   dev bypass: ${matches.devBypass ?? false}`);
  if (matches.matches?.[0]) {
    const top = matches.matches[0];
    console.log(`   #1: ${top.worker.firstName} ${top.worker.lastName} — ${top.score}%`);
    console.log(`   summary: ${top.summary}`);
  }

  // 3. Nurse recommendations
  const recs = await api("/ai/recommendations/shifts?limit=5", { token: NURSE });
  console.log("\n3. Nurse shift recommendations");
  console.log(`   total: ${recs.total}`);
  if (recs.recommendations?.[0]) {
    const top = recs.recommendations[0];
    console.log(`   #1: ${top.shift.title} — ${top.score}% match`);
    console.log(`   highlights: ${top.highlights?.join(", ") || "n/a"}`);
  }

  // 4. Apply with AI match score
  const suffix = Date.now().toString().slice(-6);
  try {
    await api(`/shifts/${shift.id}/applications`, {
      method: "POST",
      token: NURSE,
      body: { message: `M9 test apply ${suffix}` },
    });
  } catch (e) {
    if (!String(e.message).includes("already applied")) throw e;
  }
  const apps = await api(`/applications?shiftId=${shift.id}&limit=10`, { token: FACILITY });
  const mine = apps.data?.find((a) => a.message?.includes("M9 test") || a.applicant?.email?.includes("nurse"));
  console.log("\n4. Application match score");
  console.log(`   nurse application matchScore: ${mine?.matchScore ?? "n/a"}`);

  // 5. Compliance risk assessment
  const me = await api("/auth/me", { token: NURSE });
  const risks = await api(`/ai/compliance/risks/${me.id}`, { token: ADMIN });
  console.log("\n5. Compliance risk assessment");
  console.log(`   score: ${risks.score}%  compliant: ${risks.isCompliant}`);
  console.log(`   risks found: ${risks.total}`);

  // 6. Payroll anomaly scan
  const anomalies = await api("/ai/payroll/anomalies", { token: FACILITY });
  console.log("\n6. Payroll anomaly scan");
  console.log(`   anomalies: ${anomalies.total}`);
  console.log(`   dev bypass: ${anomalies.devBypass ?? false}`);

  console.log("\n✅ M9 AI Engine test passed");
}

main().catch((err) => {
  console.error("\n❌ M9 test failed:", err.message);
  process.exit(1);
});
