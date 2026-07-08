export type StaffingRole = "cna" | "lpn" | "rn";

export type RoleInputs = {
  billRate: number;
  monthlyHours: number;
  monthlyShifts: number;
};

export type StaffingInputs = Record<StaffingRole, RoleInputs>;

export type PlatformTier = {
  name: string;
  monthlyFee: number;
  maxLaborCost: number;
};

export type StaffingRoiResult = {
  roleBreakdown: Record<StaffingRole, { monthlyLabor: number; label: string }>;
  totalLaborCost: number;
  agencyMarkupCost: number;
  platformFee: number;
  monthlySavings: number;
  annualSavings: number;
  agencyMarkupRate: number;
  platformTier: string;
};

export const AGENCY_MARKUP_RATE = 0.15;
export const HOURS_PER_SHIFT = 8;

/** Tiered monthly platform fee based on total labor spend (matches industry calculator models). */
export const PLATFORM_TIERS: PlatformTier[] = [
  { name: "STARTER", monthlyFee: 750, maxLaborCost: 20_000 },
  { name: "GROWTH", monthlyFee: 1_500, maxLaborCost: 50_000 },
  { name: "ENTERPRISE", monthlyFee: 2_500, maxLaborCost: Infinity },
];

/** Defaults aligned with common facility staffing volumes (~$33.7k/mo labor). */
export const DEFAULT_STAFFING_INPUTS: StaffingInputs = {
  cna: { billRate: 31, monthlyHours: 540, monthlyShifts: 67.5 },
  lpn: { billRate: 42, monthlyHours: 225, monthlyShifts: 28.1 },
  rn: { billRate: 47, monthlyHours: 161, monthlyShifts: 20.1 },
};

export const ROLE_LABELS: Record<StaffingRole, string> = {
  cna: "CNA",
  lpn: "LPN",
  rn: "RN",
};

export const ROLE_COLORS: Record<StaffingRole, string> = {
  cna: "#0B5ED7",
  lpn: "#059669",
  rn: "#1D4ED8",
};

function sanitizeNumber(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

export function shiftsFromHours(hours: number): number {
  if (hours <= 0) return 0;
  return Math.round((hours / HOURS_PER_SHIFT) * 10) / 10;
}

export function resolvePlatformTier(totalLaborCost: number): PlatformTier {
  for (const tier of PLATFORM_TIERS) {
    if (totalLaborCost <= tier.maxLaborCost) {
      return tier;
    }
  }
  return PLATFORM_TIERS[PLATFORM_TIERS.length - 1];
}

export function calculateStaffingRoi(inputs: StaffingInputs): StaffingRoiResult {
  const roles: StaffingRole[] = ["cna", "lpn", "rn"];
  const roleBreakdown = {} as StaffingRoiResult["roleBreakdown"];

  let totalLaborCost = 0;

  for (const role of roles) {
    const billRate = sanitizeNumber(inputs[role].billRate);
    const monthlyHours = sanitizeNumber(inputs[role].monthlyHours);
    const monthlyLabor = billRate * monthlyHours;
    roleBreakdown[role] = { monthlyLabor, label: ROLE_LABELS[role] };
    totalLaborCost += monthlyLabor;
  }

  const agencyMarkupCost = Math.round(totalLaborCost * AGENCY_MARKUP_RATE);
  const tier = resolvePlatformTier(totalLaborCost);
  const platformFee = tier.monthlyFee;
  const monthlySavings = Math.max(0, agencyMarkupCost - platformFee);
  const annualSavings = monthlySavings * 12;

  return {
    roleBreakdown,
    totalLaborCost,
    agencyMarkupCost,
    platformFee,
    monthlySavings,
    annualSavings,
    agencyMarkupRate: AGENCY_MARKUP_RATE,
    platformTier: tier.name,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function buildSavingsReportText(
  inputs: StaffingInputs,
  result: StaffingRoiResult
): string {
  const lines = [
    "SOMPACARE STAFFING ROI REPORT",
    `Generated: ${new Date().toLocaleString("en-US")}`,
    "",
    "YOUR STAFFING INPUTS",
    "────────────────────",
  ];

  (["cna", "lpn", "rn"] as StaffingRole[]).forEach((role) => {
    const r = inputs[role];
    lines.push(
      `${ROLE_LABELS[role]}: $${r.billRate}/hr · ${r.monthlyHours} hrs/mo · ${r.monthlyShifts} shifts/mo`
    );
  });

  lines.push(
    "",
    "ESTIMATED SAVINGS",
    "────────────────────",
    `Total labor cost: ${formatCurrency(result.totalLaborCost)}`,
    `Average market markup (${result.agencyMarkupRate * 100}%): ${formatCurrency(result.agencyMarkupCost)}`,
    `Platform fee (${result.platformTier}): ${formatCurrency(result.platformFee)}`,
    `Total monthly savings: ${formatCurrency(result.monthlySavings)}`,
    `Annual savings: ${formatCurrency(result.annualSavings)}`,
    "",
    "Contact Sompacare: (240) 676-1208 · info@sompacare.com",
    "https://www.sompacare.com/contact"
  );

  return lines.join("\n");
}
