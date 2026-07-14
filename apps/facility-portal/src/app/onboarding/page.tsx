"use client";

import { Suspense } from "react";
import FacilityOnboardingPage from "./onboarding-content";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted">
          Loading onboarding…
        </div>
      }
    >
      <FacilityOnboardingPage />
    </Suspense>
  );
}
