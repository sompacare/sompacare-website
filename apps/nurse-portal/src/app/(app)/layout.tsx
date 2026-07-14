import { AppShell } from "@/components/layout/app-shell";
import { PortalConsentGate } from "@/components/legal/portal-consent-gate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalConsentGate>
      <AppShell>{children}</AppShell>
    </PortalConsentGate>
  );
}
