import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSetupNotice } from "@/components/admin/AdminSetupNotice";
import { PaymentSubNav } from "@/components/admin/PaymentSubNav";
import { PaymentsTable } from "@/components/admin/PaymentsTable";
import { recordManualPaymentAction } from "@/lib/admin-actions";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isOpsConfigured, listClients, listPayments, getOutstandingInvoices } from "@/lib/supabase/ops";

export default async function PaymentWirePage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  let setupError = false;
  let wirePayments: Awaited<ReturnType<typeof listPayments>> = [];
  let clients: Awaited<ReturnType<typeof listClients>> = [];
  let outstanding: Awaited<ReturnType<typeof getOutstandingInvoices>> = [];

  if (isOpsConfigured()) {
    try {
      [wirePayments, clients, outstanding] = await Promise.all([
        listPayments({ method: "wire" }),
        listClients(),
        getOutstandingInvoices(),
      ]);
    } catch {
      setupError = true;
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader badge="Payments" title="Wire Transfers" description="Record and track wire transfer payments" />
      <div className="mt-6"><PaymentSubNav /></div>

      {setupError ? (
        <div className="mt-8"><AdminSetupNotice /></div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <form action={recordManualPaymentAction} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-brand-navy">Record Wire Payment</h2>
            <input type="hidden" name="method" value="wire" />
            <div className="mt-4 space-y-3">
              <select name="client_id" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                <option value="">Select client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select name="invoice_id" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                <option value="">Select invoice (optional)</option>
                {outstanding.map((inv) => (
                  <option key={inv.id} value={inv.id}>{inv.invoice_number}</option>
                ))}
              </select>
              <input name="amount" type="number" step="0.01" required placeholder="Amount" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="reference" placeholder="Wire reference #" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <textarea name="notes" rows={2} placeholder="Notes" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <button type="submit" className="w-full rounded-full bg-brand-blue py-2.5 text-sm font-semibold text-white">Record Wire Payment</button>
            </div>
          </form>

          <div className="lg:col-span-2">
            <PaymentsTable payments={wirePayments} emptyMessage="No wire payments recorded yet." />
          </div>
        </div>
      )}
    </div>
  );
}
