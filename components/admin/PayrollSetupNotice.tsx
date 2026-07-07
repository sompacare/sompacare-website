import Link from "next/link";

export function PayrollSetupNotice() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
      <p className="font-semibold">Payroll module setup required</p>
      <p className="mt-2">
        Run <code className="rounded bg-amber-100 px-1.5 py-0.5">supabase/payroll-migration.sql</code> in your
        Supabase SQL Editor to enable payroll, timesheets, and pay runs. Then refresh this page.
      </p>
      <p className="mt-2">
        Or go to <Link href="/admin/setup" className="font-semibold underline">Admin Setup</Link> to verify your database.
      </p>
    </div>
  );
}
