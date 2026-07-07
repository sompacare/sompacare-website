import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PayrollRunsTable } from "@/components/admin/PayrollTables";
import { PayrollSetupNotice } from "@/components/admin/PayrollSetupNotice";
import { PayrollSubNav } from "@/components/admin/PayrollSubNav";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatCurrency } from "@/lib/format";
import { isPayrollConfigured, listPaidPayrollHistory } from "@/lib/supabase/payroll";

export default async function PayrollHistoryPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const configured = await isPayrollConfigured();
  let history: Awaited<ReturnType<typeof listPaidPayrollHistory>> = [];

  if (configured) {
    try { history = await listPaidPayrollHistory(); } catch { /* */ }
  }

  const totalPaid = history.reduce((s, r) => s + Number(r.total_net), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader badge="Payroll" title="Pay History" description="Completed payroll disbursements and audit trail" />
      <div className="mt-6"><PayrollSubNav /></div>

      {!configured ? (
        <div className="mt-8"><PayrollSetupNotice /></div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="text-[10px] font-bold tracking-widest text-emerald-700 uppercase">Total Disbursed (All Time)</p>
            <p className="mt-1 text-3xl font-bold text-emerald-900">{formatCurrency(totalPaid)}</p>
            <p className="mt-1 text-sm text-emerald-800">{history.length} completed pay runs</p>
          </div>
          <PayrollRunsTable runs={history} />
        </div>
      )}
    </div>
  );
}
