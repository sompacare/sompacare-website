import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSetupNotice } from "@/components/admin/AdminSetupNotice";
import { createEmployeeAction } from "@/lib/admin-actions";
import { formatDate } from "@/lib/format";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isOpsConfigured, listEmployees } from "@/lib/supabase/ops";

export default async function AdminEmployeesPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  let employees: Awaited<ReturnType<typeof listEmployees>> = [];
  let setupError = false;
  if (isOpsConfigured()) {
    try { employees = await listEmployees(); } catch { setupError = true; }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader badge="Workforce" title="Employees" description="Active clinicians and care professionals" />
      {setupError ? (
        <div className="mt-8"><AdminSetupNotice /></div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <form action={createEmployeeAction} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-brand-navy">Add Employee</h2>
            <div className="mt-4 space-y-3">
              <input name="first_name" required placeholder="First name" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="last_name" required placeholder="Last name" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="position" placeholder="Position (RN, LPN, CNA...)" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="email" type="email" placeholder="Email" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="phone" placeholder="Phone" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="license_number" placeholder="License #" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="pay_rate" type="number" step="0.01" placeholder="Pay rate" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <button type="submit" className="w-full rounded-full bg-brand-blue py-2.5 text-sm font-semibold text-white">Add Employee</button>
            </div>
          </form>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Position</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-brand-slate">No employees yet.</td></tr>
                ) : employees.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3 font-medium">{e.first_name} {e.last_name}</td>
                    <td className="px-4 py-3">{e.position ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">{e.status.replace("_", " ")}</td>
                    <td className="px-4 py-3">{formatDate(e.created_at)}</td>
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
