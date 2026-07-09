/**
 * Admin approval flow: nurse submits → admin queue → approve → nurse sees ACTIVE
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
  const tag = Date.now().toString().slice(-6);
  console.log("=== Admin Approval Flow ===\n");

  console.log("1. Nurse submits license + certification…");
  const license = await api("/compliance/licenses", {
    method: "POST",
    token: NURSE,
    body: {
      type: "RN",
      number: `RN-APPROVAL-${tag}`,
      state: "MD",
      expiresAt: new Date(Date.now() + 86400000 * 400).toISOString(),
    },
  });
  const cert = await api("/compliance/certifications", {
    method: "POST",
    token: NURSE,
    body: {
      name: `NRP Approval ${tag}`,
      issuer: "AHA",
      expiresAt: new Date(Date.now() + 86400000 * 200).toISOString(),
    },
  });
  console.log(`   license ${license.id} → ${license.status}`);
  console.log(`   cert ${cert.id} → ${cert.status}`);

  console.log("\n2. Admin opens verification queue…");
  const queueBefore = await api("/compliance/verification-queue", { token: ADMIN });
  const licInQueue = queueBefore.licenses?.some((l) => l.id === license.id);
  const certInQueue = queueBefore.certifications?.some((c) => c.id === cert.id);
  console.log(`   pending total: ${queueBefore.total}`);
  console.log(`   license in queue: ${licInQueue ? "yes" : "NO"}`);
  console.log(`   cert in queue: ${certInQueue ? "yes" : "NO"}`);
  if (!licInQueue || !certInQueue) throw new Error("Submitted items not in queue");

  console.log("\n3. Admin approves license…");
  const approvedLic = await api(`/compliance/licenses/${license.id}/verify`, {
    method: "PATCH",
    token: ADMIN,
    body: { action: "approve" },
  });
  console.log(`   license status: ${approvedLic.status}`);

  console.log("\n4. Admin approves certification…");
  const approvedCert = await api(`/compliance/certifications/${cert.id}/verify`, {
    method: "PATCH",
    token: ADMIN,
    body: { action: "approve" },
  });
  console.log(`   cert status: ${approvedCert.status}`);

  console.log("\n5. Queue cleared for these items…");
  const queueAfter = await api("/compliance/verification-queue", { token: ADMIN });
  const stillPending =
    queueAfter.licenses?.some((l) => l.id === license.id) ||
    queueAfter.certifications?.some((c) => c.id === cert.id);
  console.log(`   pending total: ${queueAfter.total}`);
  console.log(`   our items still pending: ${stillPending ? "YES (fail)" : "no"}`);

  console.log("\n6. Nurse sees ACTIVE / VERIFIED…");
  const licenses = await api("/compliance/licenses", { token: NURSE });
  const certs = await api("/compliance/certifications", { token: NURSE });
  const nurseLic = licenses.data?.find((l) => l.id === license.id);
  const nurseCert = certs.data?.find((c) => c.id === cert.id);
  console.log(`   license: ${nurseLic?.status}`);
  console.log(`   cert: ${nurseCert?.status}`);
  if (nurseLic?.status !== "ACTIVE") throw new Error("License not ACTIVE for nurse");
  if (nurseCert?.status !== "VERIFIED") throw new Error("Cert not VERIFIED for nurse");

  console.log("\n=== Admin approval flow passed ===");
  console.log(`\nTest IDs (for UI): license=${license.id} cert=${cert.id}`);
}

main().catch((e) => {
  console.error("\nFAILED:", e.message);
  process.exit(1);
});
