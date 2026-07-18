import { PortalAuthShell } from "@/components/brand/portal-auth-shell";
import { PortalSignInFlow } from "@/components/auth/portal-sign-in-flow";

export default function SignInPage() {
  return (
    <PortalAuthShell
      portalLabel="Recruiter portal"
      subtitle="Sign in to manage candidates, interviews, and placements"
    >
      <PortalSignInFlow />
    </PortalAuthShell>
  );
}
