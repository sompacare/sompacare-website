"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useApi, formatApiError } from "@/hooks/use-api";

type Props = {
  children: React.ReactNode;
};

export function PortalConsentGate({ children }: Props) {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useApi();
  const [ready, setReady] = useState<boolean | null>(null);
  const [marketingUrl, setMarketingUrl] = useState("https://www.sompacare.com");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setReady(true);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const status = await api.getLegalConsentStatus();
        if (!cancelled) {
          setReady(status.complete);
          if (status.marketingUrl) setMarketingUrl(status.marketingUrl.replace(/\/$/, ""));
        }
      } catch {
        if (!cancelled) setReady(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [api, isLoaded, isSignedIn]);

  async function accept() {
    if (!isLoaded || !isSignedIn) {
      setError("Still signing you in. Please try again in a moment.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await api.recordLegalConsent({
        documentTypes: ["PRIVACY_POLICY", "TERMS_OF_SERVICE"],
        context: "portal_access",
      });
      setReady(true);
    } catch (err) {
      setError(formatApiError(err, "Could not save your agreement."));
    } finally {
      setBusy(false);
    }
  }

  if (!isLoaded || (isSignedIn && ready === null)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        Loading…
      </div>
    );
  }

  if (isSignedIn && !ready) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
        <div className="max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
          <h2 className="text-lg font-bold text-navy">Accept terms to continue</h2>
          <p className="mt-2 text-sm text-muted">
            Before using the Sompacare portal, review and accept our legal terms.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a
                href={`${marketingUrl}/privacy`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                Privacy Policy
              </a>
            </li>
            <li>
              <a
                href={`${marketingUrl}/terms`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                Terms of Service
              </a>
            </li>
          </ul>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            type="button"
            disabled={busy}
            onClick={() => void accept()}
            className="mt-5 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "I agree — continue"}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
