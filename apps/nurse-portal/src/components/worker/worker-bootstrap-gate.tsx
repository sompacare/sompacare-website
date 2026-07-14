"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { formatApiError } from "@/lib/api";

type Props = {
  children: React.ReactNode;
};

export function WorkerBootstrapGate({ children }: Props) {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useApi();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let cancelled = false;

    async function bootstrap() {
      try {
        await api.bootstrapWorker();
        if (!cancelled) {
          setReady(true);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(formatApiError(err, "Unable to set up your worker account."));
          setReady(true);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [api, isLoaded, isSignedIn]);

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
