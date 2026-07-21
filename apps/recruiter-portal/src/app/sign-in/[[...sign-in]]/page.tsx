import { PortalAuthShell } from "@/components/brand/portal-auth-shell";
import { ClerkSignInPanel } from "@/components/auth/clerk-sign-in-panel";

export default function SignInPage() {
  return (
    <PortalAuthShell
      portalLabel="Recruiter Portal"
      subtitle="Sign in with your company email and password to manage candidates, interviews, and placements."
    >
      <ClerkSignInPanel />
    </PortalAuthShell>
  );
}
