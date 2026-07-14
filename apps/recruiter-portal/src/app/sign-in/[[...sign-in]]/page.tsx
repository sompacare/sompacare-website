import { SignIn } from "@clerk/nextjs";
import { PortalAuthShell } from "@/components/brand/portal-auth-shell";

export default function SignInPage() {
  return (
    <PortalAuthShell
      portalLabel="Recruiter portal"
      subtitle="Sign in to manage candidates, interviews, and placements"
    >
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </PortalAuthShell>
  );
}
