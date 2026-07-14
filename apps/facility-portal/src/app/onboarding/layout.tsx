import { PortalConsentGate } from "@/components/legal/portal-consent-gate";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalConsentGate>
      <div className="min-h-screen bg-background">{children}</div>
    </PortalConsentGate>
  );
}
