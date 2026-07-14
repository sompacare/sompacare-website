import { AppShell } from "@/components/layout/app-shell";
import { PortalConsentGate } from "@/components/legal/portal-consent-gate";
import { FacilityOnboardingGate } from "@/components/onboarding/facility-onboarding-gate";
import { FacilityProvider } from "@/contexts/facility-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FacilityProvider>
      <PortalConsentGate>
        <FacilityOnboardingGate>
          <AppShell>{children}</AppShell>
        </FacilityOnboardingGate>
      </PortalConsentGate>
    </FacilityProvider>
  );
}
