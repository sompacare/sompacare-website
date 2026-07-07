import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PayrollSetupNotice } from "@/components/admin/PayrollSetupNotice";
import { PayrollSubNav } from "@/components/admin/PayrollSubNav";
import { savePayProfileAction } from "@/lib/admin-actions";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatCurrency } from "@/lib/format";
import { isPayrollConfigured, listPayProfiles } from "@/lib/supabase/payroll";
import { listEmployees } from "@/lib/supabase/ops";

export default async function PayrollEmployeesPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const configured = await isPayrollConfigured();
  let profiles: Awaited<ReturnType<typeof listPayProfiles>> = [];
  let employees: Awaited<ReturnType<typeof listEmployees>> = [];

  if (configured) {
    try {
      [profiles, employees] = await Promise.all([listPayProfiles(), listEmployees()]);
    } catch { /* */ }
  }

  const profileMap = new Map(profiles.map((p) => [p.employee_id, p]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader badge="Payroll" title="Employee Pay Profiles" description="Pay rates, direct deposit, and tax configuration" />
      <div className="mt-6"><PayrollSubNav /></div>

      {!configured ? (
        <div className="mt-8"><PayrollSetupNotice /></div>
      ) : (
        <div className="mt-8 space-y-8">
          <form action={savePayProfileAction} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-brand-navy">Configure Employee Pay</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <select name="employee_id" required className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                <option value="">Select employee</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                ))}
              </select>
              <select name="pay_type" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                <option value="hourly">Hourly</option>
                <option value="salary">Salary</option>
              </select>
              <select name="pay_frequency" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="semimonthly">Semi-monthly</option>
                <option value="monthly">Monthly</option>
              </select>
              <input name="base_pay_rate" type="number" step="0.01" placeholder="Base pay rate ($)" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="overtime_multiplier" type="number" step="0.1" defaultValue="1.5" placeholder="OT multiplier" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <select name="payment_method" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                <option value="direct_deposit">Direct Deposit</option>
                <option value="check">Check</option>
              </select>
              <input name="bank_name" placeholder="Bank name" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="bank_account_last4" maxLength={4} placeholder="Account last 4" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="bank_routing_last4" maxLength={4} placeholder="Routing last 4" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <select name="federal_filing_status" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="head_of_household">Head of Household</option>
              </select>
              <input name="state_code" placeholder="State (MD, VA...)" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
            </div>
            <button type="submit" className="mt-4 rounded-full bg-brand-navy px-6 py-2.5 text-sm font-semibold text-white">Save Pay Profile</button>
          </form>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Employee</th>
                  <th className="px-4 py-3 text-left font-semibold">Pay Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Rate</th>
                  <th className="px-4 py-3 text-left font-semibold">Frequency</th>
                  <th className="px-4 py-3 text-left font-semibold">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-brand-slate">Add employees first.</td></tr>
                ) : employees.map((e) => {
                  const profile = profileMap.get(e.id);
                  return (
                    <tr key={e.id}>
                      <td className="px-4 py-3 font-medium">{e.first_name} {e.last_name}</td>
                      <td className="px-4 py-3 capitalize">{profile?.pay_type ?? "—"}</td>
                      <td className="px-4 py-3">{profile ? formatCurrency(Number(profile.base_pay_rate)) : formatCurrency(Number(e.pay_rate ?? 0))}</td>
                      <td className="px-4 py-3 capitalize">{profile?.pay_frequency?.replace("_", " ") ?? "—"}</td>
                      <td className="px-4 py-3 capitalize">{profile?.payment_method?.replace("_", " ") ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
