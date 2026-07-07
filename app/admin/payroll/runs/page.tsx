import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PayrollRunsTable } from "@/components/admin/PayrollTables";
import { PayrollSetupNotice } from "@/components/admin/PayrollSetupNotice";
import { PayrollSubNav } from "@/components/admin/PayrollSubNav";
import { createPayrollRunAction } from "@/lib/admin-actions";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { defaultPayPeriodDates } from "@/lib/payroll-calculator";
import { isPayrollConfigured, listPayrollRuns } from "@/lib/supabase/payroll";

export default async function PayrollRunsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const configured = await isPayrollConfigured();
  let runs: Awaited<ReturnType<typeof listPayrollRuns>> = [];
  if (configured) {
    try { runs = await listPayrollRuns(); } catch { /* */ }
  }

  const defaults = defaultPayPeriodDates("biweekly");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader badge="Payroll" title="Pay Runs" description="Create, approve, and process payroll cycles" />
      <div className="mt-6"><PayrollSubNav /></div>

      {!configured ? (
        <div className="mt-8"><PayrollSetupNotice /></div>
      ) : (
        <div className="mt-8 space-y-8">
          <form action={createPayrollRunAction} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-brand-navy">Create Pay Run</h2>
            <p className="mt-1 text-sm text-brand-slate">Start a new payroll cycle for your active workforce.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase text-brand-slate">Period Start</span>
                <input type="date" name="pay_period_start" defaultValue={defaults.pay_period_start} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase text-brand-slate">Period End</span>
                <input type="date" name="pay_period_end" defaultValue={defaults.pay_period_end} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase text-brand-slate">Pay Date</span>
                <input type="date" name="pay_date" defaultValue={defaults.pay_date} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              </label>
              <label className="block text-sm sm:col-span-2 lg:col-span-1">
                <span className="mb-1 block text-xs font-semibold uppercase text-brand-slate">Notes</span>
                <input name="notes" placeholder="Bi-weekly clinical staff" className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              </label>
            </div>
            <button type="submit" className="mt-4 rounded-full bg-brand-navy px-6 py-2.5 text-sm font-semibold text-white">
              Create Pay Run
            </button>
          </form>

          <PayrollRunsTable runs={runs} />
        </div>
      )}
    </div>
  );
}
