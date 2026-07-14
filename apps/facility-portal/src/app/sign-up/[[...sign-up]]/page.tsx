import { SignUp } from "@clerk/nextjs";
import { PortalAuthShell } from "@/components/brand/portal-auth-shell";

export default function SignUpPage() {
  return (
    <PortalAuthShell
      portalLabel="Facility portal"
      subtitle="Create your facility manager account — you'll set up your organization next"
    >
      <SignUp forceRedirectUrl="/onboarding" signInUrl="/sign-in" />
    </PortalAuthShell>
  );
}
