import { PortalAuthShell } from "@/components/brand/portal-auth-shell";
import { ClerkSignInPanel } from "@/components/auth/clerk-sign-in-panel";
import { RedirectVercelAppSignIn } from "@/components/auth/redirect-vercel-app-sign-in";

const RECRUITER_PORTAL_ORIGIN = "https://recruiter.sompacare.com";

export default function SignInPage() {
  return (
    <PortalAuthShell
      portalLabel="Recruiter Portal"
      subtitle="Sign in with your company email and password to manage candidates, interviews, and placements."
    >
      <RedirectVercelAppSignIn canonicalOrigin={RECRUITER_PORTAL_ORIGIN}>
        <ClerkSignInPanel />
      </RedirectVercelAppSignIn>
    </PortalAuthShell>
  );
}
