import type { ClinicalRoleValue } from "../clinical-roles";

/** Careers page position ids → platform clinical roles */
const CAREER_POSITION_TO_CLINICAL: Record<string, ClinicalRoleValue> = {
  cna: "CNA",
  gna: "GNA",
  cma: "CMA",
  "med-tech": "MED_TECH",
  lpn: "LPN",
  rn: "RN",
};

/** Clinical roles → platform RBAC worker role names */
const CLINICAL_TO_PLATFORM_ROLE: Record<ClinicalRoleValue, string> = {
  RN: "RN",
  LPN: "LPN",
  CNA: "CNA",
  GNA: "GNA",
  CMA: "CMA",
  MED_TECH: "MED_TECH",
};

export function careerPositionToClinicalRole(position: string): ClinicalRoleValue {
  const normalized = position.trim().toLowerCase();
  return CAREER_POSITION_TO_CLINICAL[normalized] ?? "RN";
}

export function clinicalRoleToPlatformRole(clinicalRole: string): string {
  return CLINICAL_TO_PLATFORM_ROLE[clinicalRole as ClinicalRoleValue] ?? "RN";
}

export function normalizeEmployeeNumber(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

/** HR-issued employee ID format: SC-XXXXXX */
export function buildEmployeeNumber(seed: string): string {
  const clean = seed.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const suffix = clean.slice(-6).padStart(6, "0");
  return `SC-${suffix}`;
}

export function buildWorkerSignupUrl(
  nursePortalUrl: string,
  email: string,
  employeeNumber?: string
): string {
  const base = nursePortalUrl.replace(/\/$/, "");
  const params = new URLSearchParams({ email });
  if (employeeNumber) {
    params.set("employeeNumber", normalizeEmployeeNumber(employeeNumber));
  }
  return `${base}/sign-up?${params.toString()}`;
}

export function buildWorkerSignInUrl(
  nursePortalUrl: string,
  email: string,
  employeeNumber?: string
): string {
  const base = nursePortalUrl.replace(/\/$/, "");
  const params = new URLSearchParams({ email });
  if (employeeNumber) {
    params.set("employeeNumber", normalizeEmployeeNumber(employeeNumber));
  }
  return `${base}/sign-in?${params.toString()}`;
}
