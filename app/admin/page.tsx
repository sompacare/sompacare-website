import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminExecutiveDashboard } from "@/components/admin/AdminExecutiveDashboard";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSetupNotice } from "@/components/admin/AdminSetupNotice";
import { getExecutiveDashboardData } from "@/lib/admin-dashboard";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatCurrency } from "@/lib/format";
import { getDashboardMetrics, isOpsConfigured } from "@/lib/supabase/ops";

export default async function AdminDashboardPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const configured = isOpsConfigured();
  const executive = configured ? await getExecutiveDashboardData() : null;

  let fallbackMetrics = {
    clients: 0,
    employees: 0,
    openJobOrders: 0,
    outstandingBalance: 0,
    paidThisMonth: 0,
    pendingApplications: 0,
  };

  if (configured && !executive) {
    try {
      fallbackMetrics = await getDashboardMetrics();
    } catch {
      /* setup error handled below */
    }
  }

  const setupError = configured && !executive;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader
        badge="Sompacare Enterprise"
        title="Operations Command Center"
        description="Real-time visibility across workforce deployment, client billing, talent acquisition, and compliance readiness."
      />

      {!configured || setupError ? (
        <div className="mt-8">
          <AdminSetupNotice />
        </div>
      ) : executive ? (
        <div className="mt-8 space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminKpiCard
              label="Revenue Collected MTD"
              value={formatCurrency(executive.metrics.paidThisMonth)}
              hint="Completed payments posted this month"
              accent="green"
            />
            <AdminKpiCard
              label="Outstanding A/R"
              value={formatCurrency(executive.metrics.outstandingBalance)}
              hint={`${executive.metrics.overdueInvoices} overdue invoices`}
              accent="amber"
            />
            <AdminKpiCard
              label="Workforce Fill Rate"
              value={`${executive.metrics.fillRate}%`}
              hint={`${executive.metrics.openJobOrders} open job orders`}
              accent="blue"
            />
            <AdminKpiCard
              label="Talent Pipeline"
              value={String(executive.metrics.pipelineApplications)}
              hint={`${executive.metrics.hiredThisMonth} hires this month`}
              accent="navy"
            />
          </div>

          <AdminExecutiveDashboard data={executive} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Clients & Contracts", href: "/admin/clients" },
              { label: "Job Orders", href: "/admin/job-orders" },
              { label: "Billing & Invoices", href: "/admin/invoices" },
              { label: "Payments Center", href: "/admin/payments" },
              { label: "Payroll Center", href: "/admin/payroll" },
              { label: "Talent Applications", href: "/admin/applications" },
              { label: "Documents", href: "/admin/documents" },
              { label: "Reports", href: "/admin/reports" },
              { label: "Settings", href: "/admin/settings" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-brand-blue shadow-sm transition-colors hover:border-brand-blue hover:bg-blue-50/40"
              >
                {item.label} →
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AdminKpiCard label="Clients" value={String(fallbackMetrics.clients)} />
          <AdminKpiCard label="Employees" value={String(fallbackMetrics.employees)} />
          <AdminKpiCard label="Open Job Orders" value={String(fallbackMetrics.openJobOrders)} />
        </div>
      )}
    </div>
  );
}
