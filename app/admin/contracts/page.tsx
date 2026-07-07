import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSetupNotice } from "@/components/admin/AdminSetupNotice";
import { createContractAction } from "@/lib/admin-actions";
import { formatDate } from "@/lib/format";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isOpsConfigured, listClients, listContracts } from "@/lib/supabase/ops";

export default async function AdminContractsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  let contracts: Awaited<ReturnType<typeof listContracts>> = [];
  let clients: Awaited<ReturnType<typeof listClients>> = [];
  let setupError = false;

  if (isOpsConfigured()) {
    try {
      [contracts, clients] = await Promise.all([listContracts(), listClients()]);
    } catch {
      setupError = true;
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader badge="Operations" title="Contracts" description="Client staffing agreements and rate schedules" />
      {setupError ? (
        <div className="mt-8"><AdminSetupNotice /></div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <form action={createContractAction} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-brand-navy">New Contract</h2>
            <div className="mt-4 space-y-3">
              <select name="client_id" required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                <option value="">Select client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input name="title" required placeholder="Contract title" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="contract_number" placeholder="Contract #" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="start_date" type="date" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="end_date" type="date" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <select name="status" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
              <textarea name="terms" rows={3} placeholder="Terms" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <button type="submit" className="w-full rounded-full bg-brand-blue py-2.5 text-sm font-semibold text-white">Create Contract</button>
            </div>
          </form>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Contract</th>
                  <th className="px-4 py-3 text-left font-semibold">Client</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Start</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contracts.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-brand-slate">No contracts yet.</td></tr>
                ) : contracts.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-medium">{c.title}</td>
                    <td className="px-4 py-3">{c.clients?.name ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">{c.status}</td>
                    <td className="px-4 py-3">{formatDate(c.start_date)}</td>
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
