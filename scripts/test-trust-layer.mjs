/**
 * Trust layer: legal docs, tenant isolation, background check consent
 */
const API_BASE = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const API = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE}/api/v1`;
const NURSE = process.env.NURSE_TOKEN ?? "Bearer dev_dev_nurse_rn";
const FACILITY = process.env.FACILITY_TOKEN ?? "Bearer dev_dev_facility_mgr";

async function api(pathname, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = token;

  const res = await fetch(`${API}${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${pathname} → ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  console.log("=== Trust Layer Test ===\n");

  console.log("1. Public legal documents…");
  const privacy = await api("/legal/documents/PRIVACY_POLICY");
  if (!privacy.data?.title) throw new Error("Expected privacy policy document");

  console.log("2. Careers consent (public)…");
  const email = `trust.test.${Date.now()}@example.com`;
  const consent = await api("/legal/consent/public", {
    method: "POST",
    body: {
      email,
      documentTypes: ["PRIVACY_POLICY", "TERMS_OF_SERVICE"],
      context: "careers_apply",
    },
  });
  if (!consent.recorded) throw new Error("Expected consent records");

  console.log("3. Tenant-scoped facilities for facility manager…");
  const facilities = await api("/facilities?limit=5", { token: FACILITY });
  if (!Array.isArray(facilities.data)) throw new Error("Expected facilities list");

  console.log("4. Nurse background check consent + initiate…");
  await api("/legal/consent", {
    method: "POST",
    token: NURSE,
    body: {
      documentTypes: ["BACKGROUND_CHECK_DISCLOSURE"],
      context: "background_check",
    },
  });
  const bg = await api("/compliance/background-checks", { method: "POST", token: NURSE });
  if (!bg.check?.id) throw new Error("Expected background check record");

  const checks = await api("/compliance/background-checks", { token: NURSE });
  if (!checks.data?.length) throw new Error("Expected background checks list");

  console.log("5. Portal legal consent status endpoint…");
  const portalStatus = await api("/legal/consent/status", { token: NURSE });
  if (typeof portalStatus.complete !== "boolean") {
    throw new Error("Expected portal consent status");
  }

  console.log("\nTrust layer test passed.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
