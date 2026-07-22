import { PortalAuthShell } from "@/components/brand/portal-auth-shell";
import { PortalSignInFlow } from "@/components/auth/portal-sign-in-flow";
import { RedirectVercelAppSignIn } from "@/components/auth/redirect-vercel-app-sign-in";

const ADMIN_PORTAL_ORIGIN = "https://admin.sompacare.com";

export default function SignInPage() {
  return (
    <PortalAuthShell
      portalLabel="Admin Portal"
      subtitle="Sign in with your company email and password to manage operations, compliance, and platform settings."
    >
      <RedirectVercelAppSignIn canonicalOrigin={ADMIN_PORTAL_ORIGIN}>
        <PortalSignInFlow />
      </RedirectVercelAppSignIn>
    </PortalAuthShell>
  );
}
