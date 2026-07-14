"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";

type Props = {
  children: React.ReactNode;
};

export function FacilityOnboardingGate({ children }: Props) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const api = useApi();
  const [ready, setReady] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let cancelled = false;

    async function check() {
      try {
        const status = await api.getFacilityOnboardingStatus();
        if (cancelled) return;
        if (status.complete) {
          setReady(true);
        } else {
          router.replace("/onboarding");
        }
      } catch {
        if (!cancelled) router.replace("/onboarding");
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [api, isLoaded, isSignedIn, router]);

  if (!isLoaded || ready === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
