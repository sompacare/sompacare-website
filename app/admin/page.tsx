import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSetupNotice } from "@/components/admin/AdminSetupNotice";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatCurrency } from "@/lib/format";
import { getDashboardMetrics, isOpsConfigured } from "@/lib/supabase/ops";

export default async function AdminDashboardPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  let metrics = {
    clients: 0,
    employees: 0,
    openJobOrders: 0,
    outstandingBalance: 0,
    paidThisMonth: 0,
    pendingApplications: 0,
  };
  const configured = isOpsConfigured();
  let setupError = false;

  if (configured) {
    try {
      metrics = await getDashboardMetrics();
    } catch {
      setupError = true;
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader
        badge="Sompacare Admin"
        title="Dashboard"
        description="Operations overview for clients, staffing, billing, and payments."
      />

      {!configured || setupError ? (
        <div className="mt-8">
          <AdminSetupNotice />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdminMetricCard label="Clients" value={String(metrics.clients)} />
            <AdminMetricCard label="Employees" value={String(metrics.employees)} />
            <AdminMetricCard label="Open Job Orders" value={String(metrics.openJobOrders)} />
            <AdminMetricCard label="Outstanding Balance" value={formatCurrency(metrics.outstandingBalance)} />
            <AdminMetricCard label="Collected This Month" value={formatCurrency(metrics.paidThisMonth)} />
            <AdminMetricCard label="New Applications" value={String(metrics.pendingApplications)} />
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Clients", href: "/admin/clients" },
              { label: "Job Orders", href: "/admin/job-orders" },
              { label: "Invoices", href: "/admin/invoices" },
              { label: "Payments", href: "/admin/payments" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-brand-blue shadow-sm hover:border-brand-blue"
              >
                Manage {item.label} →
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
