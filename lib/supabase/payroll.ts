import "server-only";

import { calculatePayrollEntry } from "@/lib/payroll-calculator";
import { getSupabaseAdmin } from "./admin";
import type {
  EmployeePayProfile,
  PayrollEntryRecord,
  PayrollRunRecord,
  PayrollSummary,
  TaxProfile,
  TimesheetRecord,
} from "./payroll-types";

function db() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export async function isPayrollConfigured(): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;
  const { error } = await supabase.from("payroll_runs").select("id").limit(1);
  return !error || !/does not exist|schema cache|PGRST205|42P01/i.test(error.message);
}

export async function generatePayrollRunNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await db().from("payroll_runs").select("*", { count: "exact", head: true });
  const seq = String((count ?? 0) + 1).padStart(3, "0");
  return `PR-${year}-${seq}`;
}

// ─── Pay Profiles ──────────────────────────────────────────────────────────

export async function listPayProfiles(): Promise<EmployeePayProfile[]> {
  const { data, error } = await db()
    .from("employee_pay_profiles")
    .select("*, employees(first_name, last_name, position, email, status)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EmployeePayProfile[];
}

export async function upsertPayProfile(input: {
  employee_id: string;
  pay_type?: EmployeePayProfile["pay_type"];
  pay_frequency?: EmployeePayProfile["pay_frequency"];
  base_pay_rate?: number;
  overtime_multiplier?: number;
  direct_deposit_enabled?: boolean;
  bank_name?: string;
  bank_account_last4?: string;
  bank_routing_last4?: string;
  payment_method?: EmployeePayProfile["payment_method"];
  tax_profile?: Partial<TaxProfile>;
}) {
  const { data, error } = await db()
    .from("employee_pay_profiles")
    .upsert(input, { onConflict: "employee_id" })
    .select("*, employees(first_name, last_name, position, email, status)")
    .single();
  if (error) throw error;
  return data as EmployeePayProfile;
}

// ─── Timesheets ────────────────────────────────────────────────────────────

export async function listTimesheets(filters?: { status?: string }): Promise<TimesheetRecord[]> {
  let query = db()
    .from("timesheets")
    .select("*, employees(first_name, last_name, position), job_orders(title, clients(name))")
    .order("work_date", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as TimesheetRecord[];
}

export async function createTimesheet(input: {
  employee_id: string;
  job_order_id?: string;
  work_date: string;
  regular_hours: number;
  overtime_hours?: number;
  notes?: string;
}) {
  const { data, error } = await db().from("timesheets").insert(input).select().single();
  if (error) throw error;
  return data as TimesheetRecord;
}

export async function updateTimesheetStatus(id: string, status: TimesheetRecord["status"]) {
  const patch: Partial<TimesheetRecord> = { status };
  if (status === "approved") patch.approved_at = new Date().toISOString();
  const { data, error } = await db().from("timesheets").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as TimesheetRecord;
}

// ─── Payroll Runs ────────────────────────────────────────────────────────────

export async function listPayrollRuns(): Promise<PayrollRunRecord[]> {
  const { data, error } = await db()
    .from("payroll_runs")
    .select("*")
    .order("pay_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PayrollRunRecord[];
}

export async function getPayrollRun(id: string): Promise<PayrollRunRecord | null> {
  const { data, error } = await db().from("payroll_runs").select("*").eq("id", id).single();
  if (error) return null;
  return data as PayrollRunRecord;
}

export async function createPayrollRun(input: {
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  notes?: string;
}) {
  const run_number = await generatePayrollRunNumber();
  const { data, error } = await db()
    .from("payroll_runs")
    .insert({ ...input, run_number, status: "draft" })
    .select()
    .single();
  if (error) throw error;
  return data as PayrollRunRecord;
}

export async function listPayrollEntries(runId: string): Promise<PayrollEntryRecord[]> {
  const { data, error } = await db()
    .from("payroll_entries")
    .select("*, employees(first_name, last_name, position)")
    .eq("payroll_run_id", runId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as PayrollEntryRecord[];
}

export async function buildPayrollRunFromTimesheets(runId: string) {
  const run = await getPayrollRun(runId);
  if (!run) throw new Error("Payroll run not found.");
  if (run.status !== "draft") throw new Error("Only draft payroll runs can be built.");

  const { data: timesheets, error: tsError } = await db()
    .from("timesheets")
    .select("*")
    .eq("status", "approved")
    .gte("work_date", run.pay_period_start)
    .lte("work_date", run.pay_period_end);

  if (tsError) throw tsError;

  const { data: profiles } = await db().from("employee_pay_profiles").select("*");
  const profileMap = new Map((profiles ?? []).map((p) => [p.employee_id as string, p]));

  const { data: employees } = await db().from("employees").select("*").eq("status", "active");
  const employeeMap = new Map((employees ?? []).map((e) => [e.id as string, e]));

  const hoursByEmployee = new Map<string, { regular: number; overtime: number; job_order_id: string | null }>();

  for (const ts of timesheets ?? []) {
    const current = hoursByEmployee.get(ts.employee_id as string) ?? { regular: 0, overtime: 0, job_order_id: null };
    current.regular += Number(ts.regular_hours);
    current.overtime += Number(ts.overtime_hours);
    current.job_order_id = (ts.job_order_id as string) ?? current.job_order_id;
    hoursByEmployee.set(ts.employee_id as string, current);
  }

  // Include active employees with pay profiles even if no timesheets
  for (const emp of employees ?? []) {
    if (!hoursByEmployee.has(emp.id as string) && profileMap.has(emp.id as string)) {
      hoursByEmployee.set(emp.id as string, { regular: 0, overtime: 0, job_order_id: null });
    }
  }

  await db().from("payroll_entries").delete().eq("payroll_run_id", runId);

  const entries: PayrollEntryRecord[] = [];
  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;

  for (const [employeeId, hours] of hoursByEmployee) {
    const profile = profileMap.get(employeeId);
    const employee = employeeMap.get(employeeId);
    const baseRate = Number(profile?.base_pay_rate ?? employee?.pay_rate ?? 0);
    const otMultiplier = Number(profile?.overtime_multiplier ?? 1.5);

    const calc = calculatePayrollEntry({
      regularHours: hours.regular,
      overtimeHours: hours.overtime,
      regularRate: baseRate,
      overtimeMultiplier: otMultiplier,
      taxProfile: (profile?.tax_profile as TaxProfile) ?? undefined,
      benefitDeductions: (profile?.benefit_deductions as { amount: number }[]) ?? [],
    });

    const { data: entry, error } = await db()
      .from("payroll_entries")
      .insert({
        payroll_run_id: runId,
        employee_id: employeeId,
        job_order_id: hours.job_order_id,
        regular_hours: hours.regular,
        overtime_hours: hours.overtime,
        regular_rate: baseRate,
        overtime_rate: baseRate * otMultiplier,
        gross_pay: calc.grossPay,
        federal_withholding: calc.federalWithholding,
        state_withholding: calc.stateWithholding,
        benefit_deductions: calc.benefitDeductions,
        other_deductions: calc.otherDeductions,
        net_pay: calc.netPay,
        payment_method: profile?.payment_method ?? "direct_deposit",
        status: "pending",
      })
      .select("*, employees(first_name, last_name, position)")
      .single();

    if (error) throw error;
    entries.push(entry as PayrollEntryRecord);
    totalGross += calc.grossPay;
    totalDeductions += calc.totalDeductions;
    totalNet += calc.netPay;
  }

  const { data: updatedRun, error: runError } = await db()
    .from("payroll_runs")
    .update({
      status: "processing",
      total_gross: totalGross,
      total_deductions: totalDeductions,
      total_net: totalNet,
      employee_count: entries.length,
    })
    .eq("id", runId)
    .select()
    .single();

  if (runError) throw runError;

  // Mark timesheets as processed
  await db()
    .from("timesheets")
    .update({ status: "processed" })
    .eq("status", "approved")
    .gte("work_date", run.pay_period_start)
    .lte("work_date", run.pay_period_end);

  return { run: updatedRun as PayrollRunRecord, entries };
}

export async function approvePayrollRun(runId: string) {
  const { data, error } = await db()
    .from("payroll_runs")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", runId)
    .select()
    .single();
  if (error) throw error;

  await db()
    .from("payroll_entries")
    .update({ status: "approved" })
    .eq("payroll_run_id", runId);

  return data as PayrollRunRecord;
}

export async function markPayrollRunPaid(runId: string) {
  const { data, error } = await db()
    .from("payroll_runs")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", runId)
    .select()
    .single();
  if (error) throw error;

  await db()
    .from("payroll_entries")
    .update({ status: "paid" })
    .eq("payroll_run_id", runId);

  return data as PayrollRunRecord;
}

export async function getPayrollSummary(): Promise<PayrollSummary> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);

  const [runs, timesheets, employees, profiles] = await Promise.all([
    listPayrollRuns(),
    listTimesheets(),
    db().from("employees").select("*", { count: "exact", head: true }).eq("status", "active"),
    listPayProfiles(),
  ]);

  const paidRuns = runs.filter((r) => r.status === "paid");
  const payrollMtd = paidRuns
    .filter((r) => r.pay_date >= monthStart)
    .reduce((s, r) => s + Number(r.total_net), 0);
  const payrollYtd = paidRuns
    .filter((r) => r.pay_date >= yearStart)
    .reduce((s, r) => s + Number(r.total_net), 0);

  const upcoming = runs
    .filter((r) => ["draft", "processing", "approved"].includes(r.status))
    .sort((a, b) => a.pay_date.localeCompare(b.pay_date));

  return {
    payrollMtd,
    payrollYtd,
    pendingRuns: runs.filter((r) => r.status === "draft" || r.status === "processing").length,
    approvedRuns: runs.filter((r) => r.status === "approved").length,
    activeEmployees: employees.count ?? profiles.length,
    pendingTimesheets: timesheets.filter((t) => t.status === "pending").length,
    approvedTimesheets: timesheets.filter((t) => t.status === "approved").length,
    nextPayDate: upcoming[0]?.pay_date ?? null,
    lastPaidRun: paidRuns[0] ?? null,
  };
}

export async function listPaidPayrollHistory(): Promise<PayrollRunRecord[]> {
  const { data, error } = await db()
    .from("payroll_runs")
    .select("*")
    .eq("status", "paid")
    .order("pay_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PayrollRunRecord[];
}
