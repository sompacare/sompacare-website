import { redirect } from "next/navigation";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PayrollRunsTable } from "@/components/admin/PayrollTables";
import { PayrollSetupNotice } from "@/components/admin/PayrollSetupNotice";
import { PayrollSubNav } from "@/components/admin/PayrollSubNav";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { getPayrollSummary, isPayrollConfigured, listPayrollRuns } from "@/lib/supabase/payroll";

export default async function PayrollOverviewPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const configured = await isPayrollConfigured();
  let summary = null;
  let recentRuns: Awaited<ReturnType<typeof listPayrollRuns>> = [];

  if (configured) {
    try {
      [summary, recentRuns] = await Promise.all([getPayrollSummary(), listPayrollRuns()]);
    } catch {
      /* setup error */
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader
        badge="Workforce Compensation"
        title="Payroll Command Center"
        description="Enterprise payroll processing — pay runs, timesheets, tax withholding, and direct deposit."
      />
      <div className="mt-6"><PayrollSubNav /></div>

      {!configured || !summary ? (
        <div className="mt-8"><PayrollSetupNotice /></div>
      ) : (
        <div className="mt-8 space-y-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-[0.16em] text-brand-navy uppercase">Payroll Health</p>
                <h2 className="mt-1 text-xl font-bold text-brand-navy">Compensation Operations Snapshot</h2>
                <p className="mt-1 text-sm text-brand-slate">
                  Next pay date: {summary.nextPayDate ? formatDate(summary.nextPayDate) : "Not scheduled"}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
                  <p className="text-[10px] font-bold tracking-widest text-emerald-700 uppercase">YTD Disbursed</p>
                  <p className="mt-1 text-lg font-bold text-emerald-900">{formatCurrency(summary.payrollYtd)}</p>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center">
                  <p className="text-[10px] font-bold tracking-widest text-blue-700 uppercase">Active Workforce</p>
                  <p className="mt-1 text-lg font-bold text-blue-900">{summary.activeEmployees}</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
                  <p className="text-[10px] font-bold tracking-widest text-amber-800 uppercase">Pending Timesheets</p>
                  <p className="mt-1 text-lg font-bold text-amber-900">{summary.pendingTimesheets}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminKpiCard label="Payroll MTD" value={formatCurrency(summary.payrollMtd)} hint="Net pay disbursed this month" accent="green" />
            <AdminKpiCard label="Pending Pay Runs" value={String(summary.pendingRuns)} hint="Draft or processing runs" accent="amber" />
            <AdminKpiCard label="Approved Runs" value={String(summary.approvedRuns)} hint="Ready for disbursement" accent="blue" />
            <AdminKpiCard label="Approved Hours" value={String(summary.approvedTimesheets)} hint="Timesheets ready for payroll" accent="navy" />
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold tracking-widest text-brand-slate uppercase">Recent Pay Runs</h3>
            <PayrollRunsTable runs={recentRuns.slice(0, 8)} />
          </div>
        </div>
      )}
    </div>
  );
}
