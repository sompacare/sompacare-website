import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PayrollSetupNotice } from "@/components/admin/PayrollSetupNotice";
import { PayrollSubNav } from "@/components/admin/PayrollSubNav";
import { approveTimesheetAction, createTimesheetAction } from "@/lib/admin-actions";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatDate } from "@/lib/format";
import { isPayrollConfigured, listTimesheets } from "@/lib/supabase/payroll";
import { listEmployees, listJobOrders } from "@/lib/supabase/ops";

export default async function PayrollTimesheetsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const configured = await isPayrollConfigured();
  let timesheets: Awaited<ReturnType<typeof listTimesheets>> = [];
  let employees: Awaited<ReturnType<typeof listEmployees>> = [];
  let jobOrders: Awaited<ReturnType<typeof listJobOrders>> = [];

  if (configured) {
    try {
      [timesheets, employees, jobOrders] = await Promise.all([
        listTimesheets(),
        listEmployees(),
        listJobOrders(),
      ]);
    } catch { /* */ }
  }

  const statusColors = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    processed: "bg-slate-200 text-slate-700",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader badge="Payroll" title="Timesheets" description="Track, approve, and process clinician hours" />
      <div className="mt-6"><PayrollSubNav /></div>

      {!configured ? (
        <div className="mt-8"><PayrollSetupNotice /></div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <form action={createTimesheetAction} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-brand-navy">Log Hours</h2>
            <div className="mt-4 space-y-3">
              <select name="employee_id" required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                <option value="">Select employee</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                ))}
              </select>
              <select name="job_order_id" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                <option value="">Assignment (optional)</option>
                {jobOrders.map((j) => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
              <input type="date" name="work_date" required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="regular_hours" type="number" step="0.25" required placeholder="Regular hours" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="overtime_hours" type="number" step="0.25" placeholder="Overtime hours" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <textarea name="notes" rows={2} placeholder="Shift notes" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <button type="submit" className="w-full rounded-full bg-brand-blue py-2.5 text-sm font-semibold text-white">Submit Timesheet</button>
            </div>
          </form>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Employee</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Hours</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timesheets.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-brand-slate">No timesheets yet.</td></tr>
                ) : timesheets.map((ts) => (
                  <tr key={ts.id}>
                    <td className="px-4 py-3 font-medium">{ts.employees?.first_name} {ts.employees?.last_name}</td>
                    <td className="px-4 py-3">{formatDate(ts.work_date)}</td>
                    <td className="px-4 py-3">{Number(ts.regular_hours)} reg / {Number(ts.overtime_hours)} OT</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColors[ts.status]}`}>{ts.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {ts.status === "pending" && (
                        <form action={approveTimesheetAction} className="inline">
                          <input type="hidden" name="timesheet_id" value={ts.id} />
                          <button type="submit" className="text-xs font-semibold text-brand-green hover:underline">Approve</button>
                        </form>
                      )}
                    </td>
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
