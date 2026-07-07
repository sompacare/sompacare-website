import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSetupNotice } from "@/components/admin/AdminSetupNotice";
import { PaymentSubNav } from "@/components/admin/PaymentSubNav";
import { PaymentsTable } from "@/components/admin/PaymentsTable";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isOpsConfigured, listPayments } from "@/lib/supabase/ops";

export default async function PaymentHistoryPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  let payments: Awaited<ReturnType<typeof listPayments>> = [];
  let setupError = false;
  if (isOpsConfigured()) {
    try { payments = await listPayments(); } catch { setupError = true; }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader badge="Payments" title="Payment History" description={`${payments.length} total payment records`} />
      <div className="mt-6"><PaymentSubNav /></div>
      {setupError ? (
        <div className="mt-8"><AdminSetupNotice /></div>
      ) : (
        <div className="mt-8">
          <PaymentsTable payments={payments} emptyMessage="No payment history yet." />
        </div>
      )}
    </div>
  );
}
