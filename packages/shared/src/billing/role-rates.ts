/** Standard Sompacare bill (facility) and pay (clinician) rates by clinical role. */
export const ROLE_STANDARD_RATES: Record<
  string,
  { payRate: number; billRate: number }
> = {
  CNA: { payRate: 22, billRate: 28 },
  RN: { payRate: 45, billRate: 55 },
  LPN: { payRate: 38, billRate: 48 },
  GNA: { payRate: 22, billRate: 28 },
  MED_TECH: { payRate: 23, billRate: 30 },
  CMA: { payRate: 22, billRate: 28 },
};

const FALLBACK = ROLE_STANDARD_RATES.CNA;

export function getStandardRatesForRole(role?: string) {
  if (!role) return FALLBACK;
  return ROLE_STANDARD_RATES[role] ?? FALLBACK;
}

export function getDefaultBillRateForRole(role?: string) {
  return getStandardRatesForRole(role).billRate;
}

export function getDefaultPayRateForRole(role?: string) {
  return getStandardRatesForRole(role).payRate;
}
