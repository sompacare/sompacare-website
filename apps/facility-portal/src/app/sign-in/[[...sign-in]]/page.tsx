import { SignIn } from "@clerk/nextjs";
import { PortalAuthShell } from "@/components/brand/portal-auth-shell";

export default function SignInPage() {
  return (
    <PortalAuthShell
      portalLabel="Facility Portal"
      subtitle="Sign in with your email and password to post shifts, manage staff, and run your facility."
    >
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/home" />
    </PortalAuthShell>
  );
}
