export function AdminSetupNotice() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
      <p className="font-semibold">Database setup required</p>
      <p className="mt-2">
        Run <code className="rounded bg-amber-100 px-1.5 py-0.5">supabase/admin-dashboard.sql</code> in your
        Supabase SQL Editor to enable this module. Also create a private storage bucket named{" "}
        <code className="rounded bg-amber-100 px-1.5 py-0.5">business-documents</code> for file uploads.
      </p>
    </div>
  );
}
