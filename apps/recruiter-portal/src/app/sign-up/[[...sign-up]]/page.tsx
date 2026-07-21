import { SignUp } from "@clerk/nextjs";
import { PortalAuthShell } from "@/components/brand/portal-auth-shell";

export default function SignUpPage() {
  return (
    <PortalAuthShell
      portalLabel="Recruiter portal"
      subtitle="Create your recruiter account with your @sompacare.com company email."
    >
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/home"
      />
    </PortalAuthShell>
  );
}
