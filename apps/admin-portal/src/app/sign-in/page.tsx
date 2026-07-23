import { PortalAuthShell } from "@/components/brand/portal-auth-shell";
import { PortalSignInFlow } from "@/components/auth/portal-sign-in-flow";

export default function SignInPage() {
  return (
    <PortalAuthShell
      portalLabel="Admin Portal"
      subtitle="Sign in with your company email and password to manage operations, compliance, and platform settings."
    >
      <PortalSignInFlow />
    </PortalAuthShell>
  );
}
