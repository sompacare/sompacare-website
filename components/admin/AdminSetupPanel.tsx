"use client";

import { useState } from "react";
import type { AdminSetupStatus } from "@/lib/admin-setup";

export function AdminSetupPanel({ initialStatus }: { initialStatus: AdminSetupStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function runSetup(action: "bootstrap" | "bucket" | "migrate") {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as {
        error?: string;
        status?: AdminSetupStatus;
        migrated?: boolean;
        needsManualSql?: boolean;
        created?: boolean;
      };
      if (!res.ok) {
        setError(data.error ?? "Setup failed.");
        return;
      }
      if (data.status) setStatus(data.status);
      if (data.created) setMessage("Created business-documents storage bucket.");
      else if (data.migrated) setMessage("Database tables created successfully.");
      else if (data.needsManualSql) {
        setMessage("Storage is ready. Run the SQL file in Supabase to finish database setup.");
      } else if (data.status?.ready) {
        setMessage("Admin dashboard setup is complete.");
      } else {
        setMessage("Setup step completed.");
      }
    } catch {
      setError("Unable to run setup.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-brand-navy">Setup Status</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-brand-slate">Supabase configured</dt>
            <dd className="font-medium">{status.supabaseConfigured ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-brand-slate">Storage bucket</dt>
            <dd className="font-medium">{status.bucketExists ? "Ready" : "Missing"}</dd>
          </div>
          <div>
            <dt className="text-brand-slate">Database URL configured</dt>
            <dd className="font-medium">{status.databaseUrlConfigured ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-brand-slate">All modules ready</dt>
            <dd className="font-medium">{status.ready ? "Yes" : "No"}</dd>
          </div>
        </dl>

        <div className="mt-5">
          <p className="text-sm font-semibold text-brand-navy">Database tables</p>
          <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            {Object.entries(status.tables).map(([table, ready]) => (
              <li key={table} className={ready ? "text-brand-green" : "text-amber-700"}>
                {ready ? "✓" : "○"} {table}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => runSetup("bootstrap")}
            disabled={loading || status.ready}
            className="rounded-full bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Running..." : "Run Auto Setup"}
          </button>
          {!status.bucketExists && (
            <button
              type="button"
              onClick={() => runSetup("bucket")}
              disabled={loading}
              className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium"
            >
              Create Storage Bucket
            </button>
          )}
          {status.databaseUrlConfigured && !status.ready && (
            <button
              type="button"
              onClick={() => runSetup("migrate")}
              disabled={loading}
              className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium"
            >
              Run Database Migration
            </button>
          )}
        </div>

        {message && <p className="mt-4 text-sm font-medium text-brand-green">{message}</p>}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>

      {status.ready && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900">
          <p className="font-semibold">All systems ready</p>
          <p className="mt-2">
            Your admin dashboard, storage, and database tables are configured. Go to{" "}
            <a href="/admin" className="font-semibold underline">
              Dashboard
            </a>{" "}
            to start managing clients, billing, and hires.
          </p>
        </div>
      )}

      {!status.ready && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          <p className="font-semibold">Manual setup only if tables are still missing</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>Open Supabase → SQL Editor → New query</li>
            <li>Paste the contents of <code className="rounded bg-amber-100 px-1">supabase/admin-dashboard.sql</code></li>
            <li>Click Run</li>
            <li>Refresh this page</li>
          </ol>
          <p className="mt-4">
            <code className="rounded bg-amber-100 px-1">DATABASE_URL</code> is only needed for automatic SQL
            migrations. If all tables show green above, your dashboard is ready — no further action required.
          </p>
          <p className="mt-2">
            If tables are still missing, run{" "}
            <code className="rounded bg-amber-100 px-1">supabase/admin-dashboard.sql</code> in Supabase SQL Editor,
            then click <strong>Run Auto Setup</strong> again.
          </p>
        </div>
      )}
    </div>
  );
}
