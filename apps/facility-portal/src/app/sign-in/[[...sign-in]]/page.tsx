import { PortalAuthShell } from "@/components/brand/portal-auth-shell";
import { ClerkSignInPanel } from "@/components/auth/clerk-sign-in-panel";
import { RedirectVercelAppSignIn } from "@/components/auth/redirect-vercel-app-sign-in";

const FACILITY_PORTAL_ORIGIN = "https://facility.sompacare.com";

export default function SignInPage() {
  return (
    <PortalAuthShell
      portalLabel="Facility Portal"
      subtitle="Sign in with your email and password to post shifts, manage staff, and run your facility."
    >
      <RedirectVercelAppSignIn canonicalOrigin={FACILITY_PORTAL_ORIGIN}>
        <ClerkSignInPanel />
      </RedirectVercelAppSignIn>
    </PortalAuthShell>
  );
}
