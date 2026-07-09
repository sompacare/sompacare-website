/**
 * M7 interactive test — submit → queue → verify → UI-ready state
 */
const API_BASE = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const API = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE}/api/v1`;
const NURSE = process.env.NURSE_TOKEN ?? "Bearer dev_user_3GExGUcVAk8Z0FtKSQeVly1hX4K";
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
  console.log("=== M7 Compliance Test ===\n");

  // 1. Baseline
  const me = await api("/compliance/me", { token: NURSE });
  console.log("1. Nurse baseline");
  console.log(`   score: ${me.data.score}%  compliant: ${me.data.isCompliant}`);
  if (me.data.blockedReasons?.length) {
    console.log(`   blocked: ${me.data.blockedReasons.join("; ")}`);
  }

  // 2. Submit pending license (visible in queue)
  const suffix = Date.now().toString().slice(-6);
  const license = await api("/compliance/licenses", {
    method: "POST",
    token: NURSE,
    body: {
      type: "LPN",
      number: `LPN-TEST-${suffix}`,
      state: "MD",
      expiresAt: new Date(Date.now() + 86400000 * 365).toISOString(),
      documentUrl: "https://example.com/license.pdf",
    },
  });
  console.log("\n2. Nurse submitted license");
  console.log(`   ${license.type} ${license.number} → ${license.status}`);

  // 3. Verification queue (admin)
  const queue = await api("/compliance/verification-queue", { token: ADMIN });
  const pendingLic = queue.licenses?.find((l) => l.id === license.id);
  console.log("\n3. Admin verification queue");
  console.log(`   total pending: ${queue.total}`);
  console.log(`   our license in queue: ${pendingLic ? "yes" : "NO"}`);

  // 4. Admin approves
  const approved = await api(`/compliance/licenses/${license.id}/verify`, {
    method: "PATCH",
    token: ADMIN,
    body: { action: "approve" },
  });
  console.log("\n4. Admin approved license");
  console.log(`   status: ${approved.status}`);

  // 5. Nurse sees updated list
  const licenses = await api("/compliance/licenses", { token: NURSE });
  const mine = licenses.data?.filter((l) => l.type === "LPN" && l.number.includes(suffix));
  console.log("\n5. Nurse license list");
  console.log(`   total licenses: ${licenses.data?.length}`);
  console.log(`   test license status: ${mine?.[0]?.status ?? "not found"}`);

  // 6. Submit + approve cert
  const cert = await api("/compliance/certifications", {
    method: "POST",
    token: NURSE,
    body: {
      name: `PALS Test ${suffix}`,
      issuer: "AHA",
      expiresAt: new Date(Date.now() + 86400000 * 180).toISOString(),
    },
  });
  await api(`/compliance/certifications/${cert.id}/verify`, {
    method: "PATCH",
    token: ADMIN,
    body: { action: "approve" },
  });
  console.log("\n6. Certification submit + approve");
  console.log(`   ${cert.name} → VERIFIED`);

  // 7. Score after changes
  const after = await api("/compliance/me", { token: NURSE });
  console.log("\n7. Updated compliance");
  console.log(`   score: ${after.data.score}%  compliant: ${after.data.isCompliant}`);

  // 8. Expiry scan
  const scan = await api("/compliance/scan-expirations", { method: "POST", token: ADMIN });
  console.log("\n8. Expiry scan");
  console.log(`   alerts created: ${scan.alertsCreated}  expired: ${scan.expired}  notified: ${scan.notified}`);

  const alerts = await api("/compliance/alerts", { token: NURSE });
  console.log(`   nurse alerts: ${alerts.data?.length ?? 0}`);

  // 9. Profile endpoint has synced score
  const profile = await api("/workers/me/profile", { token: NURSE });
  console.log("\n9. Profile sync");
  console.log(`   profile.complianceScore: ${profile.profile.complianceScore}%`);
  console.log(`   live evaluation score: ${profile.compliance.score}%`);

  console.log("\n=== M7 test passed ===");
  console.log("\nUI checks:");
  console.log("  Nurse credentials → http://localhost:3001/credentials");
  console.log("  Nurse profile     → http://localhost:3001/profile");
  console.log("  Facility queue    → http://localhost:3002/compliance (admin only)");
}

main().catch((e) => {
  console.error("\nFAILED:", e.message);
  process.exit(1);
});
