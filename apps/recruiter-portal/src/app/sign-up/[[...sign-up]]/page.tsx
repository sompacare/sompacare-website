import { PortalAuthShell } from "@/components/brand/portal-auth-shell";
import { PortalSignUpFlow } from "@/components/auth/portal-sign-up-flow";

export default function SignUpPage() {
  return (
    <PortalAuthShell
      portalLabel="Recruiter portal"
      subtitle="Create your recruiter account with your @sompacare.com company email."
    >
      <PortalSignUpFlow />
    </PortalAuthShell>
  );
}
