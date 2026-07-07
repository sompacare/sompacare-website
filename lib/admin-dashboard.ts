import "server-only";

import { listApplications } from "@/lib/supabase/admin";
import type { ApplicationRecord } from "@/lib/supabase/types";
import {
  getDashboardMetrics,
  getOutstandingInvoices,
  isOpsConfigured,
  listJobOrders,
  listPayments,
} from "@/lib/supabase/ops";
import { getPayrollSummary, isPayrollConfigured } from "@/lib/supabase/payroll";
import type { DashboardMetrics, InvoiceRecord, JobOrderRecord, PaymentRecord } from "@/lib/supabase/ops-types";
import type { PayrollSummary } from "@/lib/supabase/payroll-types";

export type ExecutiveDashboardData = {
  metrics: DashboardMetrics & {
    activeClients: number;
    pipelineApplications: number;
    hiredThisMonth: number;
    overdueInvoices: number;
    fillRate: number;
    orientationPending: number;
    payrollMtd: number;
    pendingTimesheets: number;
  };
  payroll: PayrollSummary | null;
  recentApplications: ApplicationRecord[];
  recentPayments: PaymentRecord[];
  openJobOrders: JobOrderRecord[];
  outstandingInvoices: InvoiceRecord[];
  health: {
    billing: "healthy" | "attention" | "critical";
    staffing: "healthy" | "attention" | "critical";
    talent: "healthy" | "attention" | "critical";
    payroll: "healthy" | "attention" | "critical";
  };
};

function monthStartIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function computeHealth(input: {
  outstandingBalance: number;
  overdueInvoices: number;
  openJobOrders: number;
  pipelineApplications: number;
  orientationPending: number;
  pendingTimesheets: number;
}): ExecutiveDashboardData["health"] {
  const billing =
    input.outstandingBalance > 25000 || input.overdueInvoices >= 5
      ? "critical"
      : input.outstandingBalance > 0 || input.overdueInvoices > 0
        ? "attention"
        : "healthy";

  const staffing =
    input.openJobOrders >= 10 && input.pipelineApplications < 3
      ? "critical"
      : input.openJobOrders > 0
        ? "attention"
        : "healthy";

  const talent =
    input.orientationPending >= 3
      ? "critical"
      : input.orientationPending > 0 || input.pipelineApplications >= 8
        ? "attention"
        : "healthy";

  const payroll =
    input.pendingTimesheets >= 10
      ? "critical"
      : input.pendingTimesheets > 0
        ? "attention"
        : "healthy";

  return { billing, staffing, talent, payroll };
}

export async function getExecutiveDashboardData(): Promise<ExecutiveDashboardData | null> {
  if (!isOpsConfigured()) return null;

  try {
    const monthStart = monthStartIso();
    const [baseMetrics, applications, payments, jobOrders, outstanding, payrollConfigured] = await Promise.all([
      getDashboardMetrics(),
      listApplications(),
      listPayments(),
      listJobOrders(),
      getOutstandingInvoices(),
      isPayrollConfigured(),
    ]);

    let payrollSummary: PayrollSummary | null = null;
    if (payrollConfigured) {
      try {
        payrollSummary = await getPayrollSummary();
      } catch {
        payrollSummary = null;
      }
    }

    const pipelineApplications = applications.filter((a) =>
      ["reviewing", "interviewed"].includes(a.status),
    ).length;

    const hiredThisMonth = applications.filter(
      (a) => a.status === "hired" && a.updated_at >= monthStart,
    ).length;

    const orientationPending = applications.filter(
      (a) => a.status === "hired" && !a.onboarding_sent_at,
    ).length;

    const overdueInvoices = outstanding.filter((inv) => inv.status === "overdue").length;
    const filledOrders = jobOrders.filter((order) =>
      ["filled", "in_progress", "completed"].includes(order.status),
    ).length;
    const fillRate =
      jobOrders.length > 0 ? Math.round((filledOrders / jobOrders.length) * 100) : 100;

    const metrics = {
      ...baseMetrics,
      activeClients: baseMetrics.clients,
      pipelineApplications,
      hiredThisMonth,
      overdueInvoices,
      fillRate,
      orientationPending,
      payrollMtd: payrollSummary?.payrollMtd ?? 0,
      pendingTimesheets: payrollSummary?.pendingTimesheets ?? 0,
    };

    return {
      metrics,
      payroll: payrollSummary,
      recentApplications: applications.slice(0, 6),
      recentPayments: payments.slice(0, 6),
      openJobOrders: jobOrders.filter((order) => order.status === "open").slice(0, 5),
      outstandingInvoices: outstanding.slice(0, 5),
      health: computeHealth({
        outstandingBalance: baseMetrics.outstandingBalance,
        overdueInvoices,
        openJobOrders: baseMetrics.openJobOrders,
        pipelineApplications,
        orientationPending,
        pendingTimesheets: payrollSummary?.pendingTimesheets ?? 0,
      }),
    };
  } catch {
    return null;
  }
}
