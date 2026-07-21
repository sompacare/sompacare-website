/** Strip spaces/dashes from email OTP codes (Clerk expects digits only). */
export function normalizeEmailVerificationCode(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isEmailVerificationVerified(signUp: {
  verifications?: { emailAddress?: { status?: string | null } | null } | null;
}): boolean {
  return signUp.verifications?.emailAddress?.status === "verified";
}

export type RecruiterSignUpDraft = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  legalAccepted: boolean;
};

export const RECRUITER_SIGNUP_DRAFT_KEY = "sompacare.recruiter.signupDraft";

/** Maps Clerk missingFields entries to signUp.update() payload. */
export function buildSignUpUpdateForMissingFields(
  missingFields: string[] | undefined,
  draft: Pick<RecruiterSignUpDraft, "firstName" | "lastName" | "legalAccepted">
): Record<string, string | boolean> {
  const patch: Record<string, string | boolean> = {};
  const missing = new Set(missingFields ?? []);

  if (missing.has("first_name") && draft.firstName) patch.firstName = draft.firstName;
  if (missing.has("last_name") && draft.lastName) patch.lastName = draft.lastName;
  if (
    (missing.has("legal_accepted") || missing.has("legalAccepted")) &&
    draft.legalAccepted
  ) {
    patch.legalAccepted = true;
  }

  return patch;
}
