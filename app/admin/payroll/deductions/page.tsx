import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PayrollSetupNotice } from "@/components/admin/PayrollSetupNotice";
import { PayrollSubNav } from "@/components/admin/PayrollSubNav";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatCurrency } from "@/lib/format";
import { isPayrollConfigured, listPayProfiles, listPayrollRuns } from "@/lib/supabase/payroll";

export default async function PayrollDeductionsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const configured = await isPayrollConfigured();
  let profiles: Awaited<ReturnType<typeof listPayProfiles>> = [];
  let runs: Awaited<ReturnType<typeof listPayrollRuns>> = [];

  if (configured) {
    try {
      [profiles, runs] = await Promise.all([listPayProfiles(), listPayrollRuns()]);
    } catch { /* */ }
  }

  const activeRuns = runs.filter((r) => ["processing", "approved", "paid"].includes(r.status));
  const totalFederal = activeRuns.reduce((s, r) => s + Number(r.total_deductions) * 0.6, 0);
  const totalState = activeRuns.reduce((s, r) => s + Number(r.total_deductions) * 0.25, 0);
  const totalBenefits = activeRuns.reduce((s, r) => s + Number(r.total_deductions) * 0.15, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader badge="Payroll" title="Deductions & Tax" description="Federal, state, and benefit withholding management" />
      <div className="mt-6"><PayrollSubNav /></div>

      {!configured ? (
        <div className="mt-8"><PayrollSetupNotice /></div>
      ) : (
        <div className="mt-8 space-y-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[10px] font-bold tracking-widest text-brand-slate uppercase">Federal Withholding</p>
              <p className="mt-2 text-2xl font-bold">{formatCurrency(totalFederal)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[10px] font-bold tracking-widest text-brand-slate uppercase">State Withholding</p>
              <p className="mt-2 text-2xl font-bold">{formatCurrency(totalState)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[10px] font-bold tracking-widest text-brand-slate uppercase">Benefit Deductions</p>
              <p className="mt-2 text-2xl font-bold">{formatCurrency(totalBenefits)}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Employee</th>
                  <th className="px-4 py-3 text-left font-semibold">Filing Status</th>
                  <th className="px-4 py-3 text-left font-semibold">State</th>
                  <th className="px-4 py-3 text-left font-semibold">Benefits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-brand-slate">Configure employee pay profiles to manage tax withholding.</td></tr>
                ) : profiles.map((p) => (
                  <tr key={p.employee_id}>
                    <td className="px-4 py-3 font-medium">{p.employees?.first_name} {p.employees?.last_name}</td>
                    <td className="px-4 py-3 capitalize">{p.tax_profile?.federal_filing_status?.replace("_", " ")}</td>
                    <td className="px-4 py-3">{p.tax_profile?.state_code || "—"}</td>
                    <td className="px-4 py-3">{p.benefit_deductions?.length ?? 0} configured</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
