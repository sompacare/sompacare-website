export const CLINICAL_ROLES = ["RN", "LPN", "CNA", "GNA", "CMA", "MED_TECH"] as const;

export type ClinicalRoleValue = (typeof CLINICAL_ROLES)[number];

export const CLINICAL_ROLE_LABELS: Record<ClinicalRoleValue, string> = {
  RN: "RN",
  LPN: "LPN",
  CNA: "CNA",
  GNA: "GNA",
  CMA: "CMA",
  MED_TECH: "Med Tech",
};

export const LICENSE_TYPE_HINT = CLINICAL_ROLES.map((r) => CLINICAL_ROLE_LABELS[r]).join(", ");

export function formatClinicalRoleLabel(role: string): string {
  return CLINICAL_ROLE_LABELS[role as ClinicalRoleValue] ?? role.replace(/_/g, " ");
}

export function platformRoleToClinicalRole(role: string): ClinicalRoleValue | null {
  const map: Record<string, ClinicalRoleValue> = {
    RN: "RN",
    LPN: "LPN",
    CNA: "CNA",
    GNA: "GNA",
    CMA: "CMA",
    MED_TECH: "MED_TECH",
    NURSE: "RN",
  };
  return map[role] ?? null;
}
