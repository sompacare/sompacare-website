import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSetupNotice } from "@/components/admin/AdminSetupNotice";
import { PaymentSubNav } from "@/components/admin/PaymentSubNav";
import { formatCurrency, formatDate } from "@/lib/format";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isOpsConfigured, listInvoices } from "@/lib/supabase/ops";

export default async function PaymentInvoicesPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  let invoices: Awaited<ReturnType<typeof listInvoices>> = [];
  let setupError = false;
  if (isOpsConfigured()) {
    try { invoices = await listInvoices(); } catch { setupError = true; }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader badge="Payments" title="Invoices" description="All client invoices for billing and collections" />
      <div className="mt-6"><PaymentSubNav /></div>
      {setupError ? (
        <div className="mt-8"><AdminSetupNotice /></div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Invoice</th>
                <th className="px-4 py-3 text-left font-semibold">Client</th>
                <th className="px-4 py-3 text-left font-semibold">Total</th>
                <th className="px-4 py-3 text-left font-semibold">Paid</th>
                <th className="px-4 py-3 text-left font-semibold">Balance</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => {
                const balance = Number(inv.total) - Number(inv.amount_paid);
                return (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                    <td className="px-4 py-3">{inv.clients?.name}</td>
                    <td className="px-4 py-3">{formatCurrency(Number(inv.total))}</td>
                    <td className="px-4 py-3">{formatCurrency(Number(inv.amount_paid))}</td>
                    <td className="px-4 py-3 font-semibold text-brand-navy">{formatCurrency(balance)}</td>
                    <td className="px-4 py-3 capitalize">{inv.status}</td>
                    <td className="px-4 py-3">{formatDate(inv.due_date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
