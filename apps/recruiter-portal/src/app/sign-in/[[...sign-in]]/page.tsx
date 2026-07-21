import { SignIn } from "@clerk/nextjs";
import { PortalAuthShell } from "@/components/brand/portal-auth-shell";

export default function SignInPage() {
  return (
    <PortalAuthShell
      portalLabel="Recruiter Portal"
      subtitle="Sign in with your company email and password to manage candidates, interviews, and placements."
    >
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/home" />
    </PortalAuthShell>
  );
}
