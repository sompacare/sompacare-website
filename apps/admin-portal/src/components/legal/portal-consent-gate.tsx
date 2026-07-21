"use client";

import { useAuth, useClerk, useSession } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { ApiError, formatApiError } from "@/lib/api";

type Props = {
  children: React.ReactNode;
};

export function PortalConsentGate({ children }: Props) {
  const { isLoaded, isSignedIn } = useAuth();
  const { session } = useSession();
  const { signOut } = useClerk();
  const api = useApi();
  const [ready, setReady] = useState<boolean | null>(null);
  const [authBlocked, setAuthBlocked] = useState(false);
  const [marketingUrl, setMarketingUrl] = useState("https://www.sompacare.com");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setReady(true);
      setAuthBlocked(false);
      return;
    }
    if (!session) return;

    let cancelled = false;

    async function load() {
      setError(null);
      for (let attempt = 0; attempt < 3; attempt++) {
        if (cancelled) return;
        try {
          const status = await api.getLegalConsentStatus();
          if (cancelled) return;
          setAuthBlocked(false);
          setReady(status.complete);
          if (status.marketingUrl) {
            setMarketingUrl(status.marketingUrl.replace(/\/$/, ""));
          }
          return;
        } catch (err) {
          if (
            err instanceof ApiError &&
            err.status === 401 &&
            attempt < 2 &&
            session
          ) {
            await session.reload();
            await new Promise((resolve) => setTimeout(resolve, 400));
            continue;
          }
          if (cancelled) return;
          if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
            setAuthBlocked(true);
            setReady(false);
            setError(
              formatApiError(
                err,
                "Your session expired or could not be verified. Sign in again."
              )
            );
          } else {
            setAuthBlocked(false);
            setReady(false);
            setError(formatApiError(err, "Could not verify legal terms status."));
          }
          return;
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [api, isLoaded, isSignedIn, session]);

  async function accept() {
    if (!isLoaded || !isSignedIn || !session) {
      setError("Still signing you in. Please wait a moment and try again.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await api.recordLegalConsent({
            documentTypes: ["PRIVACY_POLICY", "TERMS_OF_SERVICE"],
            context: "portal_access",
          });
          setAuthBlocked(false);
          setReady(true);
          return;
        } catch (err) {
          if (err instanceof ApiError && err.status === 401 && attempt < 2) {
            await session.reload();
            await new Promise((resolve) => setTimeout(resolve, 400));
            continue;
          }
          setError(formatApiError(err, "Could not save your agreement."));
          if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
            setAuthBlocked(true);
          }
          return;
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function signInAgain() {
    await signOut({ redirectUrl: "/sign-in" });
  }

  if (!isLoaded || (isSignedIn && !session) || (isSignedIn && ready === null && !authBlocked)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        Loading…
      </div>
    );
  }

  if (isSignedIn && (authBlocked || !ready)) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
        <div className="max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
          <h2 className="text-lg font-bold text-navy">
            {authBlocked ? "Sign in again" : "Accept terms to continue"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {authBlocked
              ? "We could not verify your session with the Sompacare API. This is usually fixed by signing in again."
              : "Before using the Sompacare portal, review and accept our legal terms."}
          </p>
          {!authBlocked && (
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
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {authBlocked ? (
            <button
              type="button"
              onClick={() => void signInAgain()}
              className="mt-5 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white"
            >
              Sign in again
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void accept()}
              className="mt-5 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Saving…" : "I agree — continue"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
