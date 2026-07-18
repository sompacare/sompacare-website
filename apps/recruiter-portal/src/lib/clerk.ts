/** Shown when Clerk JS never finishes loading. */
export const CLERK_INIT_TIMEOUT_HELP =
  "Authentication could not start. If DNS for clerk.sompacare.com is verified, add this portal URL as a satellite domain in Clerk Dashboard → Domains → Satellites, then redeploy from Render.";

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
