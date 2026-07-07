import { formatCurrency, formatDate } from "@/lib/format";
import type { PayrollEntryRecord, PayrollRunRecord } from "@/lib/supabase/payroll-types";

const runStatusStyles: Record<PayrollRunRecord["status"], string> = {
  draft: "bg-slate-100 text-slate-700",
  processing: "bg-blue-100 text-blue-800",
  approved: "bg-purple-100 text-purple-800",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export function PayrollRunStatusBadge({ status }: { status: PayrollRunRecord["status"] }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${runStatusStyles[status]}`}>
      {status}
    </span>
  );
}

export function PayrollRunsTable({ runs, showActions = true }: { runs: PayrollRunRecord[]; showActions?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Run #</th>
            <th className="px-4 py-3 text-left font-semibold">Pay Period</th>
            <th className="px-4 py-3 text-left font-semibold">Pay Date</th>
            <th className="px-4 py-3 text-left font-semibold">Employees</th>
            <th className="px-4 py-3 text-left font-semibold">Net Pay</th>
            <th className="px-4 py-3 text-left font-semibold">Status</th>
            {showActions && <th className="px-4 py-3 text-right font-semibold">View</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {runs.length === 0 ? (
            <tr>
              <td colSpan={showActions ? 7 : 6} className="px-4 py-10 text-center text-brand-slate">
                No payroll runs yet.
              </td>
            </tr>
          ) : (
            runs.map((run) => (
              <tr key={run.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-brand-navy">{run.run_number}</td>
                <td className="px-4 py-3 text-brand-slate">
                  {formatDate(run.pay_period_start)} – {formatDate(run.pay_period_end)}
                </td>
                <td className="px-4 py-3">{formatDate(run.pay_date)}</td>
                <td className="px-4 py-3">{run.employee_count}</td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(Number(run.total_net))}</td>
                <td className="px-4 py-3"><PayrollRunStatusBadge status={run.status} /></td>
                {showActions && (
                  <td className="px-4 py-3 text-right">
                    <a href={`/admin/payroll/runs/${run.id}`} className="font-semibold text-brand-blue hover:underline">
                      Open
                    </a>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function PayrollEntriesTable({ entries }: { entries: PayrollEntryRecord[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Employee</th>
            <th className="px-4 py-3 text-left font-semibold">Hours</th>
            <th className="px-4 py-3 text-left font-semibold">Gross</th>
            <th className="px-4 py-3 text-left font-semibold">Deductions</th>
            <th className="px-4 py-3 text-left font-semibold">Net Pay</th>
            <th className="px-4 py-3 text-left font-semibold">Method</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {entries.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-brand-slate">
                No payroll entries. Build this run from approved timesheets.
              </td>
            </tr>
          ) : (
            entries.map((entry) => {
              const deductions =
                Number(entry.federal_withholding) +
                Number(entry.state_withholding) +
                Number(entry.benefit_deductions) +
                Number(entry.other_deductions);
              return (
                <tr key={entry.id}>
                  <td className="px-4 py-3 font-medium">
                    {entry.employees?.first_name} {entry.employees?.last_name}
                    <p className="text-xs text-brand-slate">{entry.employees?.position}</p>
                  </td>
                  <td className="px-4 py-3">
                    {Number(entry.regular_hours)} reg / {Number(entry.overtime_hours)} OT
                  </td>
                  <td className="px-4 py-3">{formatCurrency(Number(entry.gross_pay))}</td>
                  <td className="px-4 py-3">{formatCurrency(deductions)}</td>
                  <td className="px-4 py-3 font-semibold text-brand-green">{formatCurrency(Number(entry.net_pay))}</td>
                  <td className="px-4 py-3 capitalize">{entry.payment_method.replace("_", " ")}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
