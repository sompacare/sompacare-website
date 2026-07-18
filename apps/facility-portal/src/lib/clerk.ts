/** Shown when Clerk JS never finishes loading (usually DNS / custom domain). */
export const CLERK_INIT_TIMEOUT_HELP =
  "Authentication could not start. Your Clerk publishable key is set, but the browser cannot reach clerk.sompacare.com. In Clerk Dashboard → Domains, finish the DNS CNAME setup for clerk.sompacare.com, wait for propagation, then refresh. Or temporarily use Clerk’s default publishable key (no custom domain) in Render → sompacare-portal-auth and redeploy all portals.";

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
