import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSetupNotice } from "@/components/admin/AdminSetupNotice";
import { PaymentSubNav } from "@/components/admin/PaymentSubNav";
import { formatCurrency, formatDate } from "@/lib/format";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPaidInvoices, isOpsConfigured } from "@/lib/supabase/ops";

export default async function PaymentPaidPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  let invoices: Awaited<ReturnType<typeof getPaidInvoices>> = [];
  let setupError = false;
  if (isOpsConfigured()) {
    try { invoices = await getPaidInvoices(); } catch { setupError = true; }
  }

  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader badge="Payments" title="Paid Invoices" description={`${formatCurrency(totalPaid)} collected across ${invoices.length} invoices`} />
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
                <th className="px-4 py-3 text-left font-semibold">Amount Paid</th>
                <th className="px-4 py-3 text-left font-semibold">Paid Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-brand-slate">No paid invoices yet.</td></tr>
              ) : invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                  <td className="px-4 py-3">{inv.clients?.name}</td>
                  <td className="px-4 py-3">{formatCurrency(Number(inv.total))}</td>
                  <td className="px-4 py-3">{formatDate(inv.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
