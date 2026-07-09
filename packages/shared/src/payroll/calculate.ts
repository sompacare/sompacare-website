/** Simple per-shift overtime: hours over 8 paid at 1.5× rate. */
export const OT_THRESHOLD_HOURS = 8;
export const OT_MULTIPLIER = 1.5;

export type TimecardPayInput = {
  regularHours: number;
  hourlyRate: number;
};

export type PayCalculation = {
  regularHours: number;
  overtimeHours: number;
  grossPay: number;
};

export function calculateShiftPay(input: TimecardPayInput): PayCalculation {
  const hours = Math.max(0, input.regularHours);
  const rate = input.hourlyRate;

  if (hours <= OT_THRESHOLD_HOURS) {
    return {
      regularHours: hours,
      overtimeHours: 0,
      grossPay: Math.round(hours * rate * 100) / 100,
    };
  }

  const regularHours = OT_THRESHOLD_HOURS;
  const overtimeHours = Math.round((hours - OT_THRESHOLD_HOURS) * 100) / 100;
  const grossPay =
    Math.round(
      (regularHours * rate + overtimeHours * rate * OT_MULTIPLIER) * 100
    ) / 100;

  return { regularHours, overtimeHours, grossPay };
}

export function aggregateWorkerPay(
  timecards: TimecardPayInput[],
  deductions = 0
): PayCalculation & { netPay: number; deductions: number } {
  let regularHours = 0;
  let overtimeHours = 0;
  let grossPay = 0;

  for (const tc of timecards) {
    const calc = calculateShiftPay(tc);
    regularHours += calc.regularHours;
    overtimeHours += calc.overtimeHours;
    grossPay += calc.grossPay;
  }

  grossPay = Math.round(grossPay * 100) / 100;
  const netPay = Math.max(0, Math.round((grossPay - deductions) * 100) / 100);

  return {
    regularHours: Math.round(regularHours * 100) / 100,
    overtimeHours: Math.round(overtimeHours * 100) / 100,
    grossPay,
    deductions,
    netPay,
  };
}
