import { redirect } from "next/navigation";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSetupNotice } from "@/components/admin/AdminSetupNotice";
import { formatCurrency } from "@/lib/format";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  getDashboardMetrics,
  getPaymentSummary,
  getOutstandingInvoices,
  isOpsConfigured,
  listJobOrders,
  listPayments,
} from "@/lib/supabase/ops";

export default async function AdminReportsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  let setupError = false;
  let metrics = null;
  let paymentSummary = null;
  let outstanding: Awaited<ReturnType<typeof getOutstandingInvoices>> = [];
  let recentPayments: Awaited<ReturnType<typeof listPayments>> = [];
  let openOrders = 0;

  if (isOpsConfigured()) {
    try {
      const [m, ps, out, payments, orders] = await Promise.all([
        getDashboardMetrics(),
        getPaymentSummary(),
        getOutstandingInvoices(),
        listPayments(),
        listJobOrders(),
      ]);
      metrics = m;
      paymentSummary = ps;
      outstanding = out;
      recentPayments = payments.slice(0, 10);
      openOrders = orders.filter((o) => o.status === "open").length;
    } catch {
      setupError = true;
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader badge="Analytics" title="Reports" description="Financial and operational reporting" />
      {setupError || !metrics || !paymentSummary ? (
        <div className="mt-8"><AdminSetupNotice /></div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminMetricCard label="Total Collected" value={formatCurrency(paymentSummary.totalCollected)} />
            <AdminMetricCard label="ACH Collected" value={formatCurrency(paymentSummary.achTotal)} />
            <AdminMetricCard label="Card Collected" value={formatCurrency(paymentSummary.cardTotal)} />
            <AdminMetricCard label="Wire Collected" value={formatCurrency(paymentSummary.wireTotal)} />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <AdminMetricCard label="Outstanding AR" value={formatCurrency(metrics.outstandingBalance)} hint={`${outstanding.length} open invoices`} />
            <AdminMetricCard label="Open Job Orders" value={String(openOrders)} />
            <AdminMetricCard label="Pending Payments" value={String(paymentSummary.pendingCount)} />
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="font-semibold text-brand-navy">Recent Payment Activity</h2>
            </div>
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <tbody className="divide-y divide-slate-100">
                {recentPayments.length === 0 ? (
                  <tr><td className="px-4 py-8 text-center text-brand-slate">No payments recorded yet.</td></tr>
                ) : recentPayments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">{p.clients?.name ?? "—"}</td>
                    <td className="px-4 py-3">{formatCurrency(Number(p.amount))}</td>
                    <td className="px-4 py-3 uppercase">{p.method.replace("_", " ")}</td>
                    <td className="px-4 py-3 capitalize">{p.status}</td>
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
