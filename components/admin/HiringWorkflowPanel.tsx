"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApplicationStatus } from "@/lib/supabase/types";

const PIPELINE_STATUSES: ApplicationStatus[] = [
  "new",
  "reviewing",
  "interviewed",
  "rejected",
];

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  interviewed: "Interviewed",
  placed: "Placed",
  hired: "Hired (portal)",
  rejected: "Rejected",
};

type PlatformPlaceResult = {
  placed?: boolean;
  offerSent?: boolean;
  onboardingSent?: boolean;
  reason?: string;
};

type PlatformHireResult = {
  hired?: boolean;
  employeeNumber?: string;
  reason?: string;
};

type Props = {
  applicationId: string;
  currentStatus: ApplicationStatus;
  onboardingSentAt?: string | null;
};

export function HiringWorkflowPanel({
  applicationId,
  currentStatus,
  onboardingSentAt = null,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [pipelineStatus, setPipelineStatus] = useState(
    PIPELINE_STATUSES.includes(currentStatus) ? currentStatus : "interviewed"
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error" | "info">("info");
  const [sentAt, setSentAt] = useState(onboardingSentAt);

  function setFeedback(text: string, tone: "success" | "error" | "info") {
    setMessage(text);
    setMessageTone(tone);
  }

  async function patchStatus(next: ApplicationStatus) {
    const res = await fetch(`/api/admin/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error ?? "Unable to update application status.");
    }
    return data as {
      application?: { onboarding_sent_at?: string | null; status?: ApplicationStatus };
      platformPlace?: PlatformPlaceResult | null;
      platformHire?: PlatformHireResult | null;
    };
  }

  async function runPipelineUpdate(next: ApplicationStatus) {
    setBusy("pipeline");
    setMessage("");
    try {
      await patchStatus(next);
      setStatus(next);
      setPipelineStatus(next);
      setFeedback("Pipeline status updated.", "success");
      router.refresh();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Unable to update status.", "error");
    } finally {
      setBusy(null);
    }
  }

  async function markPlaced() {
    setBusy("placed");
    setMessage("");
    try {
      const data = await patchStatus("placed");
      setStatus("placed");
      if (data.platformPlace?.placed) {
        setSentAt(data.application?.onboarding_sent_at ?? new Date().toISOString());
        setFeedback("Placed — offer letter and onboarding package emailed to the candidate.", "success");
      } else {
        setFeedback(
          "Saved as placed, but the platform could not send offer/onboarding. Check PLATFORM_API_URL and CAREERS_INGEST_SECRET on Vercel.",
          "error",
        );
      }
      router.refresh();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Unable to mark as placed.", "error");
    } finally {
      setBusy(null);
    }
  }

  async function markHired() {
    setBusy("hired");
    setMessage("");
    try {
      const data = await patchStatus("hired");
      setStatus("hired");
      if (data.platformHire?.hired) {
        setFeedback(
          data.platformHire.employeeNumber
            ? `Hired — portal invite sent with employee number ${data.platformHire.employeeNumber}.`
            : "Hired — portal invite with employee number sent.",
          "success",
        );
      } else {
        setFeedback(
          "Saved as hired, but the platform could not send the portal invite. Check PLATFORM_API_URL and CAREERS_INGEST_SECRET on Vercel.",
          "error",
        );
      }
      router.refresh();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Unable to mark as hired.", "error");
    } finally {
      setBusy(null);
    }
  }

  const placedDone = status === "placed" || status === "hired";
  const hiredDone = status === "hired";

  return (
    <div className="min-w-[280px] space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase text-brand-navy">Hiring workflow</p>
        <p className="mt-1 text-xs leading-relaxed text-brand-slate">
          Current: <span className="font-semibold capitalize text-brand-navy">{STATUS_LABELS[status]}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[10px] font-bold tracking-widest text-brand-slate uppercase">Pipeline</p>
        <label className="mt-2 block">
          <span className="sr-only">Pipeline status</span>
          <select
            value={pipelineStatus}
            disabled={Boolean(busy) || placedDone}
            onChange={(e) => void runPipelineUpdate(e.target.value as ApplicationStatus)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm capitalize outline-none focus:border-brand-blue"
          >
            {PIPELINE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-[10px] font-bold tracking-widest text-emerald-800 uppercase">Step 1 — Placed</p>
        <p className="text-xs leading-relaxed text-emerald-900">
          Sends offer letter, then onboarding package. Candidate is not given portal access yet.
        </p>
        <button
          type="button"
          disabled={Boolean(busy) || placedDone}
          onClick={() => void markPlaced()}
          className="w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "placed" ? "Sending…" : placedDone ? "Placed ✓" : "Mark as placed"}
        </button>
      </div>

      <div className="space-y-2 rounded-2xl border border-brand-blue/30 bg-brand-blue/5 p-4">
        <p className="text-[10px] font-bold tracking-widest text-brand-blue uppercase">Step 2 — Hired</p>
        <p className="text-xs leading-relaxed text-brand-navy">
          Issues employee number and emails nurse portal sign-up link. Candidate uses email + number once, then email + password.
        </p>
        <button
          type="button"
          disabled={Boolean(busy) || hiredDone}
          onClick={() => void markHired()}
          className="w-full rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "hired" ? "Sending…" : hiredDone ? "Hired ✓" : "Mark as hired & send portal invite"}
        </button>
      </div>

      {sentAt && (
        <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
          Onboarding sent{" "}
          {new Date(sentAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      )}

      {message && (
        <p
          className={`text-xs leading-relaxed ${
            messageTone === "success"
              ? "text-brand-green"
              : messageTone === "error"
                ? "text-red-600"
                : "text-brand-slate"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
