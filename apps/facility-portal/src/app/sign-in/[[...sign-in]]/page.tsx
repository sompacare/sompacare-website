import { PortalAuthShell } from "@/components/brand/portal-auth-shell";
import { PortalSignInFlow } from "@/components/auth/portal-sign-in-flow";

export default function SignInPage() {
  return (
    <PortalAuthShell
      portalLabel="Facility Portal"
      subtitle="Sign in with your email and password to post shifts, manage staff, and run your facility."
    >
      <PortalSignInFlow />
    </PortalAuthShell>
  );
}
