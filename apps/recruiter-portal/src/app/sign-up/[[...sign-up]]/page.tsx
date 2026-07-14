import { SignUp } from "@clerk/nextjs";
import { PortalAuthShell } from "@/components/brand/portal-auth-shell";

export default function SignUpPage() {
  return (
    <PortalAuthShell
      portalLabel="Recruiter portal"
      subtitle="Create your recruiter account"
    >
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </PortalAuthShell>
  );
}
