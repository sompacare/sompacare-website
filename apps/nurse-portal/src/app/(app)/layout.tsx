import { AppShell } from "@/components/layout/app-shell";
import { PortalConsentGate } from "@/components/legal/portal-consent-gate";
import { WorkerBootstrapGate } from "@/components/worker/worker-bootstrap-gate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalConsentGate>
      <WorkerBootstrapGate>
        <AppShell>{children}</AppShell>
      </WorkerBootstrapGate>
    </PortalConsentGate>
  );
}
