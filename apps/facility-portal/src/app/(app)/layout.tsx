import { AppShell } from "@/components/layout/app-shell";
import { PortalConsentGate } from "@/components/legal/portal-consent-gate";
import { FacilityProvider } from "@/contexts/facility-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FacilityProvider>
      <PortalConsentGate>
        <AppShell>{children}</AppShell>
      </PortalConsentGate>
    </FacilityProvider>
  );
}
