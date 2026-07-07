"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PayrollRunActions({
  runId,
  status,
}: {
  runId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function runAction(action: string) {
    setLoading(action);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/payroll/runs/${runId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Action failed.");
        return;
      }
      setMessage(
        action === "build"
          ? "Payroll calculated from approved timesheets."
          : action === "approve"
            ? "Payroll run approved."
            : "Payroll marked as paid.",
      );
      router.refresh();
    } catch {
      setMessage("Action failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {(status === "draft" || status === "processing") && (
        <button
          type="button"
          onClick={() => runAction("build")}
          disabled={!!loading}
          className="rounded-full bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading === "build" ? "Calculating..." : "Calculate Payroll"}
        </button>
      )}
      {(status === "processing" || status === "draft") && (
        <button
          type="button"
          onClick={() => runAction("approve")}
          disabled={!!loading}
          className="rounded-full border border-purple-300 bg-purple-50 px-5 py-2.5 text-sm font-semibold text-purple-800 disabled:opacity-60"
        >
          {loading === "approve" ? "Approving..." : "Approve Run"}
        </button>
      )}
      {status === "approved" && (
        <button
          type="button"
          onClick={() => runAction("pay")}
          disabled={!!loading}
          className="rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading === "pay" ? "Processing..." : "Process Payments"}
        </button>
      )}
      {message && <p className="w-full text-sm text-brand-green">{message}</p>}
    </div>
  );
}
