/** Shown when Clerk JS never finishes loading. */
export const CLERK_MISSING_KEY_HELP =
  "Clerk is not configured on this server. In Render → sompacare-recruiter → Environment, set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (pk_live_...) from the sompacare-portal-auth group, then redeploy.";

export const CLERK_INIT_TIMEOUT_HELP =
  "Authentication could not start. Confirm clerk.sompacare.com is verified in Clerk → Domains, this portal hostname is listed under Allowed subdomains, and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set on Render — then redeploy.";

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
