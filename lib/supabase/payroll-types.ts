export type PayType = "hourly" | "salary";
export type PayFrequency = "weekly" | "biweekly" | "semimonthly" | "monthly";
export type PayrollPaymentMethod = "direct_deposit" | "check";
export type TimesheetStatus = "pending" | "approved" | "rejected" | "processed";
export type PayrollRunStatus = "draft" | "processing" | "approved" | "paid" | "cancelled";
export type PayrollEntryStatus = "pending" | "approved" | "paid" | "void";

export type TaxProfile = {
  federal_filing_status: "single" | "married" | "head_of_household";
  federal_allowances: number;
  state_code: string;
  state_allowances: number;
};

export type BenefitDeduction = {
  name: string;
  amount: number;
  type: "fixed" | "percent";
};

export type EmployeePayProfile = {
  employee_id: string;
  pay_type: PayType;
  pay_frequency: PayFrequency;
  base_pay_rate: number;
  overtime_multiplier: number;
  direct_deposit_enabled: boolean;
  bank_name: string | null;
  bank_account_last4: string | null;
  bank_routing_last4: string | null;
  payment_method: PayrollPaymentMethod;
  tax_profile: TaxProfile;
  benefit_deductions: BenefitDeduction[];
  created_at: string;
  updated_at: string;
  employees?: {
    first_name: string;
    last_name: string;
    position: string | null;
    email: string | null;
    status: string;
  } | null;
};

export type TimesheetRecord = {
  id: string;
  employee_id: string;
  job_order_id: string | null;
  work_date: string;
  regular_hours: number;
  overtime_hours: number;
  status: TimesheetStatus;
  notes: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  employees?: { first_name: string; last_name: string; position: string | null } | null;
  job_orders?: { title: string; clients?: { name: string } | null } | null;
};

export type PayrollRunRecord = {
  id: string;
  run_number: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  status: PayrollRunStatus;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  employee_count: number;
  approved_at: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PayrollEntryRecord = {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  job_order_id: string | null;
  regular_hours: number;
  overtime_hours: number;
  regular_rate: number;
  overtime_rate: number;
  gross_pay: number;
  federal_withholding: number;
  state_withholding: number;
  benefit_deductions: number;
  other_deductions: number;
  net_pay: number;
  payment_method: PayrollPaymentMethod;
  status: PayrollEntryStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  employees?: { first_name: string; last_name: string; position: string | null } | null;
};

export type PayrollSummary = {
  payrollMtd: number;
  payrollYtd: number;
  pendingRuns: number;
  approvedRuns: number;
  activeEmployees: number;
  pendingTimesheets: number;
  approvedTimesheets: number;
  nextPayDate: string | null;
  lastPaidRun: PayrollRunRecord | null;
};
