import { SignIn } from "@clerk/nextjs";
import { PortalAuthShell } from "@/components/brand/portal-auth-shell";

export default function SignInPage() {
  return (
    <PortalAuthShell
      portalLabel="Facility portal"
      subtitle="Sign in to post shifts, manage staff, and run your facility"
    >
      <SignIn forceRedirectUrl="/home" signUpUrl="/sign-up" />
    </PortalAuthShell>
  );
}
