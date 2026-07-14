import { SignIn } from "@clerk/nextjs";
import { PortalAuthShell } from "@/components/brand/portal-auth-shell";

export default function SignInPage() {
  return (
    <PortalAuthShell
      portalLabel="Admin portal"
      subtitle="Sign in to manage operations, compliance, and platform settings"
    >
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </PortalAuthShell>
  );
}
