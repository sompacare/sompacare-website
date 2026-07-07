import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSetupNotice } from "@/components/admin/AdminSetupNotice";
import { createInvoiceAction } from "@/lib/admin-actions";
import { formatCurrency, formatDate } from "@/lib/format";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isOpsConfigured, listClients, listInvoices } from "@/lib/supabase/ops";

export default async function AdminInvoicesPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  let invoices: Awaited<ReturnType<typeof listInvoices>> = [];
  let clients: Awaited<ReturnType<typeof listClients>> = [];
  let setupError = false;

  if (isOpsConfigured()) {
    try {
      [invoices, clients] = await Promise.all([listInvoices(), listClients()]);
    } catch {
      setupError = true;
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader badge="Billing" title="Invoices" description="Client billing and accounts receivable" />
      {setupError ? (
        <div className="mt-8"><AdminSetupNotice /></div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <form action={createInvoiceAction} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-brand-navy">Create Invoice</h2>
            <div className="mt-4 space-y-3">
              <select name="client_id" required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                <option value="">Select client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input name="subtotal" type="number" step="0.01" required placeholder="Subtotal" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="tax" type="number" step="0.01" placeholder="Tax" defaultValue="0" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="due_days" type="number" defaultValue="30" placeholder="Due in days" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <textarea name="notes" rows={2} placeholder="Notes" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <button type="submit" className="w-full rounded-full bg-brand-blue py-2.5 text-sm font-semibold text-white">Send Invoice</button>
            </div>
          </form>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Invoice</th>
                  <th className="px-4 py-3 text-left font-semibold">Client</th>
                  <th className="px-4 py-3 text-left font-semibold">Total</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-brand-slate">No invoices yet.</td></tr>
                ) : invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                    <td className="px-4 py-3">{inv.clients?.name ?? "—"}</td>
                    <td className="px-4 py-3">{formatCurrency(Number(inv.total))}</td>
                    <td className="px-4 py-3 capitalize">{inv.status}</td>
                    <td className="px-4 py-3">{formatDate(inv.due_date)}</td>
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
