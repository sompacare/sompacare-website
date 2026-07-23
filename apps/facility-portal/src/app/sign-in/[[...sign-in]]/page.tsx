import { PortalAuthShell } from "@/components/brand/portal-auth-shell";
import { ClerkSignInPanel } from "@/components/auth/clerk-sign-in-panel";

export default function SignInPage() {
  return (
    <PortalAuthShell
      portalLabel="Facility Portal"
      subtitle="Sign in with your email and password to post shifts, manage staff, and run your facility."
    >
      <ClerkSignInPanel />
    </PortalAuthShell>
  );
}
