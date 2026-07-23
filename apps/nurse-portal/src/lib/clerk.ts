export const CLERK_MISSING_KEY_HELP =
  "Clerk is not configured on this server. In Render, set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (pk_live_...) on the sompacare-portal-auth env group for this service, then redeploy.";

export const CLERK_INIT_TIMEOUT_HELP =
  "Authentication could not start. Confirm clerk.sompacare.com is verified in Clerk → Domains, this portal hostname is under Allowed subdomains, and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set — then redeploy.";

export const CLERK_INIT_TIMEOUT_HELP_LOCAL =
  "Clerk did not start locally. Use http://localhost (not 127.0.0.1), run npm run portals:sync-env from a valid .env.portals.local, paste pk_test_/sk_test_ from Clerk → Sompacare Staffing, add URLs from npm run clerk:local-urls, then restart the portal dev server.";

export function formatClerkError(err: unknown, fallback = "Something went wrong. Please try again.") {
  if (err && typeof err === "object" && "errors" in err) {
    const errors = (err as { errors?: Array<{ longMessage?: string; message?: string }> }).errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const message = errors
        .map((entry) => entry.longMessage || entry.message)
        .filter(Boolean)
        .join(" ");
      if (message) return message;
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function hasClerkPublishableKey() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());
}
