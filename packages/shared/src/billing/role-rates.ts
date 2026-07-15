/** Standard Sompacare bill (facility) and pay (clinician) rates by clinical role. */
export const ROLE_STANDARD_RATES = {
  CNA: { payRate: 22, billRate: 28 },
  RN: { payRate: 45, billRate: 55 },
  LPN: { payRate: 38, billRate: 48 },
  GNA: { payRate: 22, billRate: 28 },
  MED_TECH: { payRate: 23, billRate: 30 },
  CMA: { payRate: 22, billRate: 28 },
} as const;

export type RoleRate = { payRate: number; billRate: number };
export type RoleRateMap = Record<string, RoleRate>;

const FALLBACK = ROLE_STANDARD_RATES.CNA;

export function normalizeRoleRateMap(input: unknown): RoleRateMap {
  const base: RoleRateMap = { ...ROLE_STANDARD_RATES };
  if (!input || typeof input !== "object") return base;

  for (const [role, value] of Object.entries(input as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue;
    const payRate = Number((value as RoleRate).payRate);
    const billRate = Number((value as RoleRate).billRate);
    if (!Number.isFinite(payRate) || !Number.isFinite(billRate) || billRate < payRate) {
      continue;
    }
    base[role] = {
      payRate: Math.round(payRate * 100) / 100,
      billRate: Math.round(billRate * 100) / 100,
    };
  }

  return base;
}

export function getStandardRatesForRole(role?: string, rates?: RoleRateMap): RoleRate {
  const table: RoleRateMap = rates ?? { ...ROLE_STANDARD_RATES };
  if (!role) return table.CNA ?? FALLBACK;
  return table[role] ?? table.CNA ?? FALLBACK;
}

export function getDefaultBillRateForRole(role?: string, rates?: RoleRateMap) {
  return getStandardRatesForRole(role, rates).billRate;
}

export function getDefaultPayRateForRole(role?: string, rates?: RoleRateMap) {
  return getStandardRatesForRole(role, rates).payRate;
}
