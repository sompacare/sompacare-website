import Link from "next/link";

export function AdminSetupNotice() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
      <p className="font-semibold">Database setup required</p>
      <p className="mt-2">
        The admin database tables are not set up yet. Go to{" "}
        <Link href="/admin/setup" className="font-semibold underline">
          Admin Setup
        </Link>{" "}
        to fix storage and database automatically, or run{" "}
        <code className="rounded bg-amber-100 px-1.5 py-0.5">supabase/admin-dashboard.sql</code> in your
        Supabase SQL Editor.
      </p>
    </div>
  );
}
