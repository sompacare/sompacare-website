type ClerkErrorEntry = { longMessage?: string; message?: string; code?: string };

/** Concatenated Clerk API error text, if any. */
export function clerkErrorMessages(err: unknown): string {
  if (err && typeof err === "object" && "errors" in err) {
    const errors = (err as { errors?: ClerkErrorEntry[] }).errors;
    if (Array.isArray(errors) && errors.length > 0) {
      return errors
        .map((entry) => entry.longMessage || entry.message || "")
        .filter(Boolean)
        .join(" ");
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return "";
}

export function isAlreadySignedInClerkError(err: unknown): boolean {
  return /already signed in/i.test(clerkErrorMessages(err));
}

export function isAlreadyVerifiedClerkError(err: unknown): boolean {
  return /already been verified|already verified/i.test(clerkErrorMessages(err));
}
