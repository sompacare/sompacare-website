import { notFound, redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PayrollEntriesTable, PayrollRunStatusBadge } from "@/components/admin/PayrollTables";
import { PayrollRunActions } from "@/components/admin/PayrollRunActions";
import { PayrollSubNav } from "@/components/admin/PayrollSubNav";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { getPayrollRun, listPayrollEntries } from "@/lib/supabase/payroll";

export default async function PayrollRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const { id } = await params;
  const run = await getPayrollRun(id);
  if (!run) notFound();

  const entries = await listPayrollEntries(id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader
        badge="Payroll Run"
        title={run.run_number}
        description={`${formatDate(run.pay_period_start)} – ${formatDate(run.pay_period_end)} · Pay date ${formatDate(run.pay_date)}`}
      />
      <div className="mt-6"><PayrollSubNav /></div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest text-brand-slate uppercase">Status</p>
          <div className="mt-2"><PayrollRunStatusBadge status={run.status} /></div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest text-brand-slate uppercase">Gross Pay</p>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(Number(run.total_gross))}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest text-brand-slate uppercase">Deductions</p>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(Number(run.total_deductions))}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest text-emerald-700 uppercase">Net Disbursement</p>
          <p className="mt-2 text-2xl font-bold text-emerald-900">{formatCurrency(Number(run.total_net))}</p>
        </div>
      </div>

      <div className="mt-6">
        <PayrollRunActions runId={run.id} status={run.status} />
      </div>

      <div className="mt-8">
        <h3 className="mb-4 text-sm font-bold tracking-widest text-brand-slate uppercase">Employee Pay Stubs</h3>
        <PayrollEntriesTable entries={entries} />
      </div>
    </div>
  );
}
