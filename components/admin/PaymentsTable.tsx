import { capitalize, formatCurrency, formatDateTime } from "@/lib/format";
import type { PaymentRecord } from "@/lib/supabase/ops-types";

export function PaymentsTable({ payments, emptyMessage }: { payments: PaymentRecord[]; emptyMessage: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Client</th>
            <th className="px-4 py-3 text-left font-semibold">Invoice</th>
            <th className="px-4 py-3 text-left font-semibold">Amount</th>
            <th className="px-4 py-3 text-left font-semibold">Method</th>
            <th className="px-4 py-3 text-left font-semibold">Status</th>
            <th className="px-4 py-3 text-left font-semibold">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {payments.length === 0 ? (
            <tr><td colSpan={6} className="px-4 py-10 text-center text-brand-slate">{emptyMessage}</td></tr>
          ) : payments.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">{p.clients?.name ?? "—"}</td>
              <td className="px-4 py-3">{p.invoices?.invoice_number ?? "—"}</td>
              <td className="px-4 py-3 font-medium">{formatCurrency(Number(p.amount))}</td>
              <td className="px-4 py-3">{capitalize(p.method.replace("_", " "))}</td>
              <td className="px-4 py-3 capitalize">{p.status}</td>
              <td className="px-4 py-3">{formatDateTime(p.paid_at ?? p.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
