import { redirect } from "next/navigation";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSetupNotice } from "@/components/admin/AdminSetupNotice";
import { PaymentSubNav } from "@/components/admin/PaymentSubNav";
import { formatCurrency, formatDate } from "@/lib/format";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getOutstandingInvoices, isOpsConfigured } from "@/lib/supabase/ops";

export default async function PaymentOutstandingPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  let invoices: Awaited<ReturnType<typeof getOutstandingInvoices>> = [];
  let setupError = false;
  if (isOpsConfigured()) {
    try { invoices = await getOutstandingInvoices(); } catch { setupError = true; }
  }

  const totalOutstanding = invoices.reduce(
    (sum, inv) => sum + (Number(inv.total) - Number(inv.amount_paid)),
    0,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader badge="Payments" title="Outstanding Balance" description="Unpaid and partially paid invoices" />
      <div className="mt-6"><PaymentSubNav /></div>
      {setupError ? (
        <div className="mt-8"><AdminSetupNotice /></div>
      ) : (
        <>
          <div className="mt-8 max-w-sm">
            <AdminMetricCard label="Total Outstanding" value={formatCurrency(totalOutstanding)} hint={`${invoices.length} invoices`} />
          </div>
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Invoice</th>
                  <th className="px-4 py-3 text-left font-semibold">Client</th>
                  <th className="px-4 py-3 text-left font-semibold">Balance Due</th>
                  <th className="px-4 py-3 text-left font-semibold">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-brand-slate">No outstanding invoices.</td></tr>
                ) : invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                    <td className="px-4 py-3">{inv.clients?.name}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(Number(inv.total) - Number(inv.amount_paid))}</td>
                    <td className="px-4 py-3">{formatDate(inv.due_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
