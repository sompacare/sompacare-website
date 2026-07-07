import { redirect } from "next/navigation";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSetupNotice } from "@/components/admin/AdminSetupNotice";
import { PaymentSubNav } from "@/components/admin/PaymentSubNav";
import { formatCurrency } from "@/lib/format";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getDashboardMetrics, getPaymentSummary, isOpsConfigured } from "@/lib/supabase/ops";

export default async function PaymentsOverviewPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  let setupError = false;
  let summary = null;
  let metrics = null;

  if (isOpsConfigured()) {
    try {
      [summary, metrics] = await Promise.all([getPaymentSummary(), getDashboardMetrics()]);
    } catch {
      setupError = true;
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader badge="Billing" title="Payments" description="Invoices, collections, and payment methods" />
      <div className="mt-6"><PaymentSubNav /></div>

      {setupError || !summary || !metrics ? (
        <div className="mt-8"><AdminSetupNotice /></div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard label="Outstanding Balance" value={formatCurrency(metrics.outstandingBalance)} />
          <AdminMetricCard label="Collected (All Time)" value={formatCurrency(summary.totalCollected)} />
          <AdminMetricCard label="ACH Collected" value={formatCurrency(summary.achTotal)} />
          <AdminMetricCard label="Pending Payments" value={String(summary.pendingCount)} />
        </div>
      )}
    </div>
  );
}
