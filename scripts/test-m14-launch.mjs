/**
 * M14 Launch Readiness — docs, production config, golden-path API validation
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const API_BASE = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const API = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE}/api/v1`;
const NURSE = process.env.NURSE_TOKEN ?? "Bearer dev_dev_nurse_rn";
const FACILITY = process.env.FACILITY_TOKEN ?? "Bearer dev_dev_facility_mgr";
const ADMIN = process.env.ADMIN_TOKEN ?? "Bearer dev_dev_admin";
const ROOT = process.cwd();

const REQUIRED_DOCS = [
  "docs/launch/README.md",
  "docs/launch/launch-checklist.md",
  "docs/launch/production-cutover-runbook.md",
  "docs/launch/incident-response.md",
  "docs/launch/security-pentest-remediation.md",
  "docs/guides/nurse-portal-guide.md",
  "docs/guides/facility-portal-guide.md",
  "docs/guides/admin-portal-guide.md",
  "docs/guides/recruiter-portal-guide.md",
  ".env.production.example",
];

async function api(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function assertProductionHardening() {
  const prod = readFileSync(join(ROOT, ".env.production.example"), "utf8");
  const checks = [
    ["AUTH_ALLOW_DEV_TOKENS=false", "dev tokens must be disabled"],
    ["GEOFENCE_DEV_BYPASS=false", "geofence bypass must be disabled"],
    ["PAYMENTS_DEV_BYPASS=false", "payments bypass must be disabled"],
    ["NODE_ENV=production", "NODE_ENV must be production"],
    ["sslmode=require", "database must require SSL"],
  ];
  for (const [needle, msg] of checks) {
    if (!prod.includes(needle)) throw new Error(`Production config: ${msg}`);
  }
}

async function goldenPath() {
  const health = await api("/health");
  if (health.status !== "healthy" && health.status !== "degraded") {
    throw new Error(`Health not ok: ${health.status}`);
  }

  const shifts = await api("/shifts?limit=5&status=PUBLISHED", { token: NURSE });
  const shiftCount = shifts.data?.length ?? 0;

  const apps = await api("/applications?limit=5", { token: FACILITY });
  const appCount = apps.data?.length ?? 0;

  const dashboard = await api("/admin/dashboard", { token: ADMIN });

  const config = await api("/mobile/config");

  return {
    health: health.status,
    database: health.services?.database,
    redis: health.services?.redis,
    shifts: shiftCount,
    applications: appCount,
    adminUsers: dashboard.kpis?.totalUsers,
    mobileConfig: !!config.offlineClockQueue,
  };
}

async function main() {
  console.log("=== M14 Launch Readiness Test ===\n");

  for (const doc of REQUIRED_DOCS) {
    if (!existsSync(join(ROOT, doc))) throw new Error(`Missing: ${doc}`);
  }
  console.log(`1. Launch docs present (${REQUIRED_DOCS.length} files) ✅`);

  assertProductionHardening();
  console.log("2. Production env hardening verified ✅");

  const cutover = readFileSync(join(ROOT, "docs/launch/production-cutover-runbook.md"), "utf8");
  if (!cutover.includes("Rollback procedure")) throw new Error("Cutover runbook incomplete");
  console.log("3. Cutover runbook includes rollback ✅");

  const incident = readFileSync(join(ROOT, "docs/launch/incident-response.md"), "utf8");
  if (!incident.includes("P1")) throw new Error("Incident response missing severity levels");
  console.log("4. Incident response playbook present ✅");

  const pentest = readFileSync(join(ROOT, "docs/launch/security-pentest-remediation.md"), "utf8");
  if (!pentest.includes("AUTH_ALLOW_DEV_TOKENS=false")) {
    throw new Error("Pentest tracker missing dev token control");
  }
  console.log("5. Security remediation tracker present ✅");

  const path = await goldenPath();
  console.log("\n6. Golden-path API validation");
  console.log(`   health: ${path.health} (db: ${path.database}, redis: ${path.redis})`);
  console.log(`   nurse shifts: ${path.shifts}`);
  console.log(`   facility applications: ${path.applications}`);
  console.log(`   admin dashboard users: ${path.adminUsers}`);
  console.log(`   mobile config: ${path.mobileConfig}`);

  console.log("\n✅ M14 launch readiness test passed");
  console.log("\nNext: complete docs/launch/launch-checklist.md and schedule cutover");
}

main().catch((err) => {
  console.error("\n❌ M14 test failed:", err.message);
  process.exit(1);
});
