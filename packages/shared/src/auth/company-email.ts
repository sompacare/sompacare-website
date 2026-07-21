export const SOMPACARE_COMPANY_EMAIL_DOMAIN = "sompacare.com";

/** True when the address is a Sompacare staff mailbox (e.g. you@sompacare.com). */
export function isSompacareCompanyEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at < 0) return false;
  return normalized.slice(at + 1) === SOMPACARE_COMPANY_EMAIL_DOMAIN;
}
