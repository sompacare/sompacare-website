import { PortalAuthShell } from "@/components/brand/portal-auth-shell";
import { PortalSignInFlow } from "@/components/auth/portal-sign-in-flow";

export default function SignInPage() {
  return (
    <PortalAuthShell
      portalLabel="Facility portal"
      subtitle="Sign in to post shifts, manage staff, and run your facility"
    >
      <PortalSignInFlow />
    </PortalAuthShell>
  );
}
