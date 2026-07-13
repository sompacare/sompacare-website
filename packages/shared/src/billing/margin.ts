/**
 * Competitive per-shift markup for healthcare staffing (2025–2026 market).
 * Bill rate = what facilities pay; pay rate = what clinicians earn.
 * Platform margin = bill rate − pay rate (per hour × hours worked).
 */
export const ROLE_MARKUP_RATES: Record<string, number> = {
  CNA: 0.3,
  GNA: 0.3,
  CMA: 0.28,
  MED_TECH: 0.3,
  LPN: 0.27,
  RN: 0.25,
  ALLIED_HEALTH: 0.28,
  OTHER: 0.27,
};

/** Minimum hourly spread so low-rate roles still earn platform margin. */
export const MIN_HOURLY_SPREAD = 4;

export type ShiftRateInput = {
  payRate: number;
  role?: string;
  billRate?: number;
};

export type ResolvedShiftRates = {
  payRate: number;
  billRate: number;
  markupRate: number;
  hourlySpread: number;
};

export function getMarkupRateForRole(role?: string): number {
  if (!role) return ROLE_MARKUP_RATES.OTHER;
  return ROLE_MARKUP_RATES[role] ?? ROLE_MARKUP_RATES.OTHER;
}

export function calculateBillRate(payRate: number, role?: string): number {
  const markup = getMarkupRateForRole(role);
  const markedUp = payRate * (1 + markup);
  const withMinSpread = payRate + MIN_HOURLY_SPREAD;
  return Math.round(Math.max(markedUp, withMinSpread) * 100) / 100;
}

export function resolveShiftRates(input: ShiftRateInput): ResolvedShiftRates {
  const payRate = Math.round(Math.max(0, input.payRate) * 100) / 100;
  const markupRate = getMarkupRateForRole(input.role);
  const billRate =
    input.billRate != null && input.billRate >= payRate
      ? Math.round(input.billRate * 100) / 100
      : calculateBillRate(payRate, input.role);

  return {
    payRate,
    billRate,
    markupRate,
    hourlySpread: Math.round((billRate - payRate) * 100) / 100,
  };
}

export function calculateTimecardAmounts(
  regularHours: number,
  payRate: number,
  billRate: number
): { payAmount: number; billAmount: number } {
  const hours = Math.max(0, regularHours);
  const payAmount = Math.round(hours * payRate * 100) / 100;
  const billAmount = Math.round(hours * billRate * 100) / 100;
  return { payAmount, billAmount };
}

export function calculatePlatformMargin(
  regularHours: number,
  payRate: number,
  billRate: number
): number {
  const { payAmount, billAmount } = calculateTimecardAmounts(
    regularHours,
    payRate,
    billRate
  );
  return Math.round((billAmount - payAmount) * 100) / 100;
}
