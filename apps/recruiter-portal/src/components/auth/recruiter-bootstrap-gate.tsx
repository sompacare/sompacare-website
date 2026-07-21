"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useApi, ApiError } from "@/hooks/use-api";

type Props = {
  children: React.ReactNode;
};

function formatBootstrapError(err: unknown): string {
  if (err instanceof ApiError) {
    const body = err.body as { message?: string | string[] } | undefined;
    const message = body?.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message) && message[0]) return message[0];
  }
  if (err instanceof Error && err.message) return err.message;
  return "Unable to set up recruiter access.";
}

function isAccessDenied(message: string) {
  return /company email|terminated|worker|facility portal|forbidden|403/i.test(message);
}

export function RecruiterBootstrapGate({ children }: Props) {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const api = useApi();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let cancelled = false;

    async function bootstrap() {
      try {
        await api.bootstrapRecruiter();
        if (!cancelled) {
          setReady(true);
          setError(null);
        }
      } catch (err) {
        const message = formatBootstrapError(err);
        if (!cancelled) {
          if (isAccessDenied(message)) {
            await signOut();
          }
          setError(message);
          setReady(true);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [api, isLoaded, isSignedIn, signOut]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        Loading…
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        Setting up recruiter access…
      </div>
    );
  }

  if (error && isAccessDenied(error)) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="max-w-md text-sm text-red-700">{error}</p>
        <a href="/sign-in" className="text-sm font-semibold text-primary hover:underline">
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}
      {children}
    </>
  );
}
