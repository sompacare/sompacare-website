"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { formatApiError } from "@/lib/api";
import { getStoredEmployeeAccess } from "@/components/auth/employee-access-gate";

type Props = {
  children: React.ReactNode;
};

function isTerminatedMessage(message: string) {
  return /terminated|not active|access has been/i.test(message);
}

export function WorkerBootstrapGate({ children }: Props) {
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
        const stored = getStoredEmployeeAccess();
        await api.bootstrapWorker(stored.employeeNumber || undefined);
        if (!cancelled) {
          setReady(true);
          setError(null);
        }
      } catch (err) {
        const message = formatApiError(err, "Unable to set up your worker account.");
        if (!cancelled) {
          if (isTerminatedMessage(message)) {
            await signOut();
            setError(
              "Your Sompacare access has been terminated. Contact HR if you believe this is an error."
            );
          } else {
            setError(message);
          }
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
        Setting up your account…
      </div>
    );
  }

  if (error && isTerminatedMessage(error)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <p className="max-w-md text-center text-sm text-red-700">{error}</p>
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
