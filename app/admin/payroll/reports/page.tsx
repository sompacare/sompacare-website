import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PayrollSetupNotice } from "@/components/admin/PayrollSetupNotice";
import { PayrollSubNav } from "@/components/admin/PayrollSubNav";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatCurrency } from "@/lib/format";
import { getPayrollSummary, isPayrollConfigured, listPayrollRuns } from "@/lib/supabase/payroll";

export default async function PayrollReportsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const configured = await isPayrollConfigured();
  let summary = null;
  let runs: Awaited<ReturnType<typeof listPayrollRuns>> = [];

  if (configured) {
    try {
      [summary, runs] = await Promise.all([getPayrollSummary(), listPayrollRuns()]);
    } catch { /* */ }
  }

  const paidRuns = runs.filter((r) => r.status === "paid");
  const avgNet = paidRuns.length > 0
    ? paidRuns.reduce((s, r) => s + Number(r.total_net), 0) / paidRuns.length
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader badge="Payroll" title="Payroll Reports" description="Compensation analytics and compliance reporting" />
      <div className="mt-6"><PayrollSubNav /></div>

      {!configured || !summary ? (
        <div className="mt-8"><PayrollSetupNotice /></div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {[
            { title: "Payroll Summary", items: [
              ["YTD Net Disbursements", formatCurrency(summary.payrollYtd)],
              ["MTD Net Disbursements", formatCurrency(summary.payrollMtd)],
              ["Average Pay Run", formatCurrency(avgNet)],
              ["Active Employees on Payroll", String(summary.activeEmployees)],
            ]},
            { title: "Operations", items: [
              ["Pending Timesheets", String(summary.pendingTimesheets)],
              ["Approved Timesheets", String(summary.approvedTimesheets)],
              ["Pending Pay Runs", String(summary.pendingRuns)],
              ["Runs Awaiting Disbursement", String(summary.approvedRuns)],
            ]},
            { title: "Compliance", items: [
              ["Completed Pay Runs", String(paidRuns.length)],
              ["Last Pay Run", summary.lastPaidRun?.run_number ?? "—"],
              ["Last Disbursement", summary.lastPaidRun ? formatCurrency(Number(summary.lastPaidRun.total_net)) : "—"],
              ["Next Scheduled Pay Date", summary.nextPayDate ?? "—"],
            ]},
            { title: "Export Ready", items: [
              ["941 Quarterly Report", "Available after pay runs"],
              ["W-2 Annual Summary", "Year-end processing"],
              ["Direct Deposit Register", "Per pay run detail"],
              ["Labor Cost by Assignment", "Job order linked timesheets"],
            ]},
          ].map((section) => (
            <div key={section.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold tracking-widest text-brand-slate uppercase">{section.title}</h3>
              <dl className="mt-4 space-y-3">
                {section.items.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm">
                    <dt className="text-brand-slate">{label}</dt>
                    <dd className="font-semibold text-brand-navy">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
