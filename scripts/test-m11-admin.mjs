/**
 * M11 Admin Platform — dashboard, audit, support tickets, feature flags
 */
const API_BASE = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const API = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE}/api/v1`;
const ADMIN = process.env.ADMIN_TOKEN ?? "Bearer dev_dev_admin";

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: ADMIN },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  console.log("=== M11 Admin Platform Test ===\n");

  const dashboard = await api("/admin/dashboard");
  console.log("1. Dashboard KPIs");
  console.log(`   users: ${dashboard.kpis.totalUsers}`);
  console.log(`   facilities: ${dashboard.kpis.totalFacilities}`);
  console.log(`   fill rate: ${dashboard.kpis.fillRate}%`);
  console.log(`   open tickets: ${dashboard.kpis.openTickets}`);

  const insights = await api("/admin/insights");
  console.log("\n2. Insights");
  console.log(`   summary: ${insights.aiSummary}`);
  console.log(`   enabled flags: ${insights.enabledFlags}`);
  console.log(`   urgent tickets: ${insights.urgentTickets}`);

  const audit = await api("/admin/audit-logs?limit=5");
  console.log("\n3. Audit logs");
  console.log(`   entries: ${audit.data?.length ?? 0}`);

  const tickets = await api("/admin/support-tickets");
  console.log("\n4. Support tickets");
  console.log(`   total: ${tickets.data?.length ?? 0}`);

  const flags = await api("/admin/feature-flags");
  console.log("\n5. Feature flags");
  console.log(`   total: ${flags.length ?? 0}`);

  const users = await api("/users?limit=5");
  console.log("\n6. Users (admin access)");
  console.log(`   sample: ${users.data?.length ?? 0}`);

  const facilities = await api("/facilities?limit=5");
  console.log("\n7. Facilities (admin access)");
  console.log(`   sample: ${facilities.data?.length ?? 0}`);

  if (flags.length > 0) {
    const key = flags[0].key;
    const toggled = await api(`/admin/feature-flags/${key}`, {
      method: "PATCH",
      body: { isEnabled: !flags[0].isEnabled },
    });
    console.log(`\n8. Toggle flag "${key}" → ${toggled.isEnabled ? "enabled" : "disabled"}`);
    await api(`/admin/feature-flags/${key}`, {
      method: "PATCH",
      body: { isEnabled: flags[0].isEnabled },
    });
    console.log("   restored original state");
  }

  console.log("\n✅ M11 admin platform test passed");
}

main().catch((err) => {
  console.error("\n❌ M11 test failed:", err.message);
  process.exit(1);
});
