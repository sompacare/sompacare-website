import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSetupNotice } from "@/components/admin/AdminSetupNotice";
import { createClientAction } from "@/lib/admin-actions";
import { formatDate } from "@/lib/format";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isOpsConfigured, listClients } from "@/lib/supabase/ops";

export default async function AdminClientsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  let clients: Awaited<ReturnType<typeof listClients>> = [];
  let setupError = false;
  if (isOpsConfigured()) {
    try {
      clients = await listClients();
    } catch {
      setupError = true;
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader badge="Operations" title="Clients" description={`${clients.length} client organizations`} />
      {setupError ? (
        <div className="mt-8"><AdminSetupNotice /></div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <form action={createClientAction} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
            <h2 className="text-lg font-bold text-brand-navy">Add Client</h2>
            <div className="mt-4 space-y-3">
              <input name="name" required placeholder="Organization name" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <select name="type" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                <option value="facility">Facility</option>
                <option value="family">Family</option>
                <option value="agency">Agency</option>
                <option value="other">Other</option>
              </select>
              <input name="contact_name" placeholder="Contact name" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="email" type="email" placeholder="Email" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="phone" placeholder="Phone" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="billing_email" type="email" placeholder="Billing email" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <button type="submit" className="w-full rounded-full bg-brand-blue py-2.5 text-sm font-semibold text-white">Create Client</button>
            </div>
          </form>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Client</th>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-brand-slate">No clients yet.</td></tr>
                ) : clients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-navy">{c.name}</p>
                      <p className="text-xs text-brand-slate">{c.email ?? c.contact_name ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 capitalize">{c.type}</td>
                    <td className="px-4 py-3 capitalize">{c.status}</td>
                    <td className="px-4 py-3">{formatDate(c.created_at)}</td>
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
