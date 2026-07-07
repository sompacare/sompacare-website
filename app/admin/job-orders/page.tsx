import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSetupNotice } from "@/components/admin/AdminSetupNotice";
import { createJobOrderAction } from "@/lib/admin-actions";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isOpsConfigured, listClients, listJobOrders } from "@/lib/supabase/ops";

export default async function AdminJobOrdersPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  let jobOrders: Awaited<ReturnType<typeof listJobOrders>> = [];
  let clients: Awaited<ReturnType<typeof listClients>> = [];
  let setupError = false;

  if (isOpsConfigured()) {
    try {
      [jobOrders, clients] = await Promise.all([listJobOrders(), listClients()]);
    } catch {
      setupError = true;
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader badge="Operations" title="Job Orders" description="Open and filled staffing requests" />
      {setupError ? (
        <div className="mt-8"><AdminSetupNotice /></div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <form action={createJobOrderAction} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-brand-navy">New Job Order</h2>
            <div className="mt-4 space-y-3">
              <select name="client_id" required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                <option value="">Select client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input name="title" required placeholder="Order title" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="role" required placeholder="Role (RN, LPN, CNA...)" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="location" placeholder="Location" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="shift_details" placeholder="Shift details" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="start_date" type="date" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="bill_rate" type="number" step="0.01" placeholder="Bill rate" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="pay_rate" type="number" step="0.01" placeholder="Pay rate" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <button type="submit" className="w-full rounded-full bg-brand-blue py-2.5 text-sm font-semibold text-white">Create Job Order</button>
            </div>
          </form>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Order</th>
                  <th className="px-4 py-3 text-left font-semibold">Client</th>
                  <th className="px-4 py-3 text-left font-semibold">Assigned</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobOrders.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-brand-slate">No job orders yet.</td></tr>
                ) : jobOrders.map((j) => (
                  <tr key={j.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{j.title}</p>
                      <p className="text-xs text-brand-slate">{j.role}</p>
                    </td>
                    <td className="px-4 py-3">{j.clients?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      {j.employees ? `${j.employees.first_name} ${j.employees.last_name}` : "Unassigned"}
                    </td>
                    <td className="px-4 py-3 capitalize">{j.status.replace("_", " ")}</td>
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
