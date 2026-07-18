import { PortalAuthShell } from "@/components/brand/portal-auth-shell";
import { PortalSignInFlow } from "@/components/auth/portal-sign-in-flow";

export default function SignInPage() {
  return (
    <PortalAuthShell
      portalLabel="Admin portal"
      subtitle="Sign in to manage operations, compliance, and platform settings"
    >
      <PortalSignInFlow />
    </PortalAuthShell>
  );
}
