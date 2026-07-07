import Link from "next/link";
import type { ExecutiveDashboardData } from "@/lib/admin-dashboard";
import { formatCurrency, formatDate } from "@/lib/format";

const healthStyles = {
  healthy: "bg-emerald-50 text-emerald-800 border-emerald-200",
  attention: "bg-amber-50 text-amber-800 border-amber-200",
  critical: "bg-red-50 text-red-800 border-red-200",
};

const healthLabels = {
  healthy: "On Track",
  attention: "Needs Attention",
  critical: "Action Required",
};

export function AdminExecutiveDashboard({ data }: { data: ExecutiveDashboardData }) {
  const { metrics, health } = data;
  const reportDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] text-brand-blue uppercase">
              Executive Operations Center
            </p>
            <h2 className="mt-1 text-xl font-bold text-brand-navy">Enterprise Performance Snapshot</h2>
            <p className="mt-1 text-sm text-brand-slate">Reporting period · {reportDate}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {([
              ["Billing", health.billing],
              ["Staffing", health.staffing],
              ["Talent Pipeline", health.talent],
              ["Payroll", health.payroll],
            ] as const).map(([label, status]) => (
              <div
                key={label}
                className={`rounded-xl border px-4 py-3 text-center ${healthStyles[status]}`}
              >
                <p className="text-[10px] font-bold tracking-widest uppercase">{label}</p>
                <p className="mt-1 text-sm font-semibold">{healthLabels[status]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        <section className="xl:col-span-2 space-y-4">
          <h3 className="text-sm font-bold tracking-widest text-brand-slate uppercase">Workforce & Revenue</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdminMiniStat label="Active Clients" value={String(metrics.activeClients)} />
            <AdminMiniStat label="Deployed Workforce" value={String(metrics.employees)} />
            <AdminMiniStat label="Open Job Orders" value={String(metrics.openJobOrders)} />
            <AdminMiniStat label="Fill Rate" value={`${metrics.fillRate}%`} />
            <AdminMiniStat label="Talent Pipeline" value={String(metrics.pipelineApplications)} />
            <AdminMiniStat label="Hired This Month" value={String(metrics.hiredThisMonth)} />
            <AdminMiniStat label="Outstanding A/R" value={formatCurrency(metrics.outstandingBalance)} />
            <AdminMiniStat label="Collected MTD" value={formatCurrency(metrics.paidThisMonth)} />
            <AdminMiniStat label="Payroll MTD" value={formatCurrency(metrics.payrollMtd)} />
            <AdminMiniStat label="Pending Timesheets" value={String(metrics.pendingTimesheets)} />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold tracking-widest text-brand-slate uppercase">Priority Actions</h3>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <ul className="space-y-3 text-sm">
              <ActionItem
                href="/admin/applications"
                label="Review new applications"
                detail={`${metrics.pendingApplications} awaiting triage`}
                urgent={metrics.pendingApplications > 0}
              />
              <ActionItem
                href="/admin/payments/outstanding"
                label="Collect outstanding balances"
                detail={formatCurrency(metrics.outstandingBalance)}
                urgent={metrics.outstandingBalance > 0}
              />
              <ActionItem
                href="/admin/job-orders"
                label="Fill open assignments"
                detail={`${metrics.openJobOrders} open orders`}
                urgent={metrics.openJobOrders > 0}
              />
              <ActionItem
                href="/admin/payroll/timesheets"
                label="Approve payroll timesheets"
                detail={`${metrics.pendingTimesheets} pending approval`}
                urgent={metrics.pendingTimesheets > 0}
              />
              <ActionItem
                href="/admin/applications"
                label="Complete hire orientations"
                detail={`${metrics.orientationPending} hires pending package`}
                urgent={metrics.orientationPending > 0}
              />
            </ul>
          </div>
        </section>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <ActivityPanel
          title="Recent Applications"
          href="/admin/applications"
          empty="No applications yet."
          rows={data.recentApplications.map((app) => ({
            id: app.id,
            primary: `${app.first_name} ${app.last_name}`,
            secondary: app.position_label,
            meta: app.status,
            href: `/admin/applications/${app.id}`,
            date: app.created_at,
          }))}
        />
        <ActivityPanel
          title="Recent Payments"
          href="/admin/payments/history"
          empty="No payments recorded."
          rows={data.recentPayments.map((payment) => ({
            id: payment.id,
            primary: formatCurrency(Number(payment.amount)),
            secondary: payment.method.replace("_", " "),
            meta: payment.status,
            href: "/admin/payments/history",
            date: payment.paid_at ?? payment.created_at,
          }))}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <ActivityPanel
          title="Open Job Orders"
          href="/admin/job-orders"
          empty="No open job orders."
          rows={data.openJobOrders.map((order) => ({
            id: order.id,
            primary: order.title,
            secondary: order.clients?.name ?? "Unassigned client",
            meta: order.role,
            href: "/admin/job-orders",
            date: order.created_at,
          }))}
        />
        <ActivityPanel
          title="Outstanding Invoices"
          href="/admin/payments/outstanding"
          empty="No outstanding invoices."
          rows={data.outstandingInvoices.map((invoice) => ({
            id: invoice.id,
            primary: invoice.invoice_number,
            secondary: invoice.clients?.name ?? "Client",
            meta: formatCurrency(Number(invoice.total) - Number(invoice.amount_paid)),
            href: "/admin/invoices",
            date: invoice.due_date,
          }))}
        />
      </div>
    </div>
  );
}

function AdminMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[10px] font-bold tracking-widest text-brand-slate uppercase">{label}</p>
      <p className="mt-1 text-lg font-bold text-brand-navy">{value}</p>
    </div>
  );
}

function ActionItem({
  href,
  label,
  detail,
  urgent,
}: {
  href: string;
  label: string;
  detail: string;
  urgent: boolean;
}) {
  return (
    <li>
      <Link href={href} className="flex items-start justify-between gap-3 rounded-lg px-2 py-1 hover:bg-slate-50">
        <div>
          <p className="font-semibold text-brand-navy">{label}</p>
          <p className="text-xs text-brand-slate">{detail}</p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
            urgent ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
          }`}
        >
          {urgent ? "Now" : "Open"}
        </span>
      </Link>
    </li>
  );
}

function ActivityPanel({
  title,
  href,
  empty,
  rows,
}: {
  title: string;
  href: string;
  empty: string;
  rows: {
    id: string;
    primary: string;
    secondary: string;
    meta: string;
    href: string;
    date: string;
  }[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-bold text-brand-navy">{title}</h3>
        <Link href={href} className="text-xs font-semibold text-brand-blue hover:underline">
          View all
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-sm text-brand-slate">{empty}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((row) => (
            <li key={row.id}>
              <Link href={row.href} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="truncate font-medium text-brand-navy">{row.primary}</p>
                  <p className="truncate text-xs text-brand-slate">{row.secondary}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold capitalize text-brand-blue">{row.meta}</p>
                  <p className="text-[11px] text-brand-slate">{formatDate(row.date)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
