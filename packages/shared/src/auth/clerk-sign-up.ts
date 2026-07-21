/** Strip spaces/dashes from email OTP codes (Clerk expects digits only). */
export function normalizeEmailVerificationCode(raw: string): string {
  return raw.replace(/\s/g, "").replace(/-/g, "");
}

export function isEmailVerificationVerified(signUp: {
  verifications?: { emailAddress?: { status?: string | null } | null } | null;
}): boolean {
  return signUp.verifications?.emailAddress?.status === "verified";
}
