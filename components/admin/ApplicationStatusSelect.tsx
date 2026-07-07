"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApplicationStatus } from "@/lib/supabase/types";

const STATUSES: ApplicationStatus[] = ["new", "reviewing", "interviewed", "hired", "rejected"];

type OnboardingResult = {
  sent: boolean;
  relayed?: boolean;
  error?: string;
};

export function ApplicationStatusSelect({
  applicationId,
  currentStatus,
  onboardingSentAt,
}: {
  applicationId: string;
  currentStatus: ApplicationStatus;
  onboardingSentAt?: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error" | "info">("info");
  const [sentAt, setSentAt] = useState(onboardingSentAt ?? null);
  const [resending, setResending] = useState(false);

  function setFeedback(text: string, tone: "success" | "error" | "info") {
    setMessage(text);
    setMessageTone(tone);
  }

  async function updateStatus(next: ApplicationStatus) {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFeedback(data.error ?? "Unable to update status.", "error");
        return;
      }

      setStatus(next);

      const onboarding = data.onboarding as OnboardingResult | null | undefined;
      if (next === "hired" && onboarding) {
        if (onboarding.sent) {
          setSentAt(data.application?.onboarding_sent_at ?? new Date().toISOString());
          setFeedback(
            onboarding.relayed
              ? "Hired — welcome email delivered. Complete the Assignment Readiness Center below, then send the full orientation package."
              : "Hired — welcome email sent. Complete hire details below and send the orientation package.",
            "success",
          );
        } else {
          setFeedback(
            "Status saved as hired, but the onboarding email could not be sent. Use “Resend onboarding” below.",
            "error",
          );
        }
      } else if (next === "hired" && data.application?.onboarding_sent_at) {
        setSentAt(data.application.onboarding_sent_at);
        setFeedback("Status updated. Onboarding was previously sent.", "success");
      } else {
        setFeedback("Status updated.", "success");
      }

      router.refresh();
    } catch {
      setFeedback("Unable to update status.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function resendOnboarding() {
    setResending(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/onboarding`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFeedback(data.error ?? "Unable to send onboarding email.", "error");
        return;
      }

      setSentAt(data.onboarding_sent_at ?? new Date().toISOString());
      setFeedback(
        data.onboarding?.relayed
          ? "Onboarding email delivered via delivery fallback. Confirm the applicant received it."
          : "Onboarding email sent successfully.",
        "success",
      );
      router.refresh();
    } catch {
      setFeedback("Unable to send onboarding email.", "error");
    } finally {
      setResending(false);
    }
  }

  const showResend = status === "hired" && !sentAt;

  return (
    <div className="min-w-[220px]">
      <label htmlFor="appStatus" className="mb-2 block text-xs font-semibold uppercase text-brand-navy">
        Application Status
      </label>
      <select
        id="appStatus"
        value={status}
        disabled={loading}
        onChange={(e) => updateStatus(e.target.value as ApplicationStatus)}
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm capitalize outline-none focus:border-brand-blue"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {sentAt && (
        <p className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
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

      {showResend && (
        <button
          type="button"
          onClick={resendOnboarding}
          disabled={resending || loading}
          className="mt-3 w-full rounded-xl border border-brand-blue/30 bg-brand-blue/5 px-4 py-2.5 text-xs font-semibold text-brand-blue transition-colors hover:bg-brand-blue/10 disabled:opacity-60"
        >
          {resending ? "Sending onboarding…" : "Resend onboarding email"}
        </button>
      )}

      {message && (
        <p
          className={`mt-3 text-xs leading-relaxed ${
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
