import type { TaxProfile } from "@/lib/supabase/payroll-types";

const DEFAULT_TAX: TaxProfile = {
  federal_filing_status: "single",
  federal_allowances: 0,
  state_code: "",
  state_allowances: 0,
};

export function calculatePayrollEntry(input: {
  regularHours: number;
  overtimeHours: number;
  regularRate: number;
  overtimeMultiplier?: number;
  taxProfile?: Partial<TaxProfile>;
  benefitDeductions?: Array<{ amount: number; type?: string }>;
  otherDeductions?: number;
}) {
  const otMultiplier = input.overtimeMultiplier ?? 1.5;
  const regularPay = input.regularHours * input.regularRate;
  const overtimePay = input.overtimeHours * input.regularRate * otMultiplier;
  const grossPay = round(regularPay + overtimePay);

  const tax = input.taxProfile ?? DEFAULT_TAX;
  const federalRate = tax.federal_filing_status === "married" ? 0.1 : 0.12;
  const stateRate = tax.state_code ? 0.05 : 0;

  const federalWithholding = round(grossPay * federalRate);
  const stateWithholding = round(grossPay * stateRate);

  const benefitDeductions = round(
    (input.benefitDeductions ?? []).reduce((sum, d) => sum + Number(d.amount), 0),
  );
  const otherDeductions = round(input.otherDeductions ?? 0);
  const totalDeductions = round(
    federalWithholding + stateWithholding + benefitDeductions + otherDeductions,
  );
  const netPay = round(Math.max(grossPay - totalDeductions, 0));

  return {
    grossPay,
    federalWithholding,
    stateWithholding,
    benefitDeductions,
    otherDeductions,
    totalDeductions,
    netPay,
  };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export function defaultPayPeriodDates(frequency: "weekly" | "biweekly" | "semimonthly" | "monthly" = "biweekly") {
  const end = new Date();
  const start = new Date(end);

  if (frequency === "weekly") start.setDate(end.getDate() - 6);
  else if (frequency === "biweekly") start.setDate(end.getDate() - 13);
  else if (frequency === "semimonthly") start.setDate(end.getDate() > 15 ? 16 : 1);
  else start.setDate(1);

  const payDate = new Date(end);
  payDate.setDate(payDate.getDate() + 3);

  return {
    pay_period_start: start.toISOString().slice(0, 10),
    pay_period_end: end.toISOString().slice(0, 10),
    pay_date: payDate.toISOString().slice(0, 10),
  };
}
