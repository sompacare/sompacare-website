export const DEFAULT_REFERRAL_BONUS = 50;

/** Build a short, human-friendly referral code from user identity */
export function buildReferralCode(
  firstName: string,
  lastName: string,
  userId: string
): string {
  const first = firstName.trim().charAt(0).toUpperCase() || "S";
  const last = (lastName.trim().slice(0, 3) || "REF").toUpperCase();
  const suffix = userId.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "0000";
  return `${first}${last}-${suffix}`;
}

export function normalizeReferralCode(code: string): string {
  return code.trim().toUpperCase();
}

export function buildCareersReferralUrl(siteUrl: string, code: string): string {
  const base = siteUrl.replace(/\/$/, "");
  return `${base}/careers?ref=${encodeURIComponent(normalizeReferralCode(code))}`;
}
