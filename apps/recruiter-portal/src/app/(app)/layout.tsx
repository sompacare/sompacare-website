import { AppShell } from "@/components/layout/app-shell";
import { RecruiterBootstrapGate } from "@/components/auth/recruiter-bootstrap-gate";
import { PortalConsentGate } from "@/components/legal/portal-consent-gate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalConsentGate>
      <RecruiterBootstrapGate>
        <AppShell>{children}</AppShell>
      </RecruiterBootstrapGate>
    </PortalConsentGate>
  );
}
