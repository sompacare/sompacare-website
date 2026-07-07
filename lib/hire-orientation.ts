export type ComplianceStatus = "not_started" | "pending" | "cleared" | "waived";

export type HireComplianceChecklist = {
  license_verified: ComplianceStatus;
  background_check: ComplianceStatus;
  drug_screen: ComplianceStatus;
  i9_completed: ComplianceStatus;
  hipaa_training: ComplianceStatus;
  tb_test: ComplianceStatus;
  immunizations: ComplianceStatus;
  skills_checklist: ComplianceStatus;
  facility_orientation: ComplianceStatus;
};

export type HireDetails = {
  facility_name: string;
  facility_address: string;
  client_contact_name: string;
  client_contact_phone: string;
  assignment_type: "per_diem" | "contract" | "travel" | "permanent" | "home_health" | "";
  start_date: string;
  end_date: string;
  shift_schedule: string;
  reporting_manager: string;
  reporting_manager_email: string;
  orientation_date: string;
  orientation_time: string;
  orientation_mode: "in_person" | "virtual" | "hybrid" | "";
  orientation_location: string;
  orientation_coordinator: string;
  pay_rate: string;
  bill_rate: string;
  employee_id_badge: string;
  parking_instructions: string;
  dress_code: string;
  compliance: HireComplianceChecklist;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  internal_notes: string;
  package_items: string[];
};

export const ORIENTATION_PACKAGE_ITEMS = [
  "Welcome letter & offer confirmation",
  "Facility assignment summary",
  "Orientation schedule & reporting instructions",
  "Compliance & credentialing checklist",
  "HIPAA & workplace safety acknowledgments",
  "Payroll & direct deposit forms",
  "Benefits enrollment guide",
  "Emergency contact form",
  "ID badge & parking instructions",
  "Clinical competency & skills checklist",
] as const;

export const COMPLIANCE_LABELS: Record<keyof HireComplianceChecklist, string> = {
  license_verified: "Professional license verified",
  background_check: "Background check cleared",
  drug_screen: "Drug screen completed",
  i9_completed: "I-9 & work authorization",
  hipaa_training: "HIPAA training assigned",
  tb_test: "TB test / health screening",
  immunizations: "Immunization records on file",
  skills_checklist: "Skills competency checklist",
  facility_orientation: "Facility-specific orientation",
};

export function emptyComplianceChecklist(): HireComplianceChecklist {
  return {
    license_verified: "not_started",
    background_check: "not_started",
    drug_screen: "not_started",
    i9_completed: "not_started",
    hipaa_training: "not_started",
    tb_test: "not_started",
    immunizations: "not_started",
    skills_checklist: "not_started",
    facility_orientation: "not_started",
  };
}

export function emptyHireDetails(): HireDetails {
  return {
    facility_name: "",
    facility_address: "",
    client_contact_name: "",
    client_contact_phone: "",
    assignment_type: "",
    start_date: "",
    end_date: "",
    shift_schedule: "",
    reporting_manager: "",
    reporting_manager_email: "",
    orientation_date: "",
    orientation_time: "",
    orientation_mode: "",
    orientation_location: "",
    orientation_coordinator: "",
    pay_rate: "",
    bill_rate: "",
    employee_id_badge: "",
    parking_instructions: "",
    dress_code: "",
    compliance: emptyComplianceChecklist(),
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    internal_notes: "",
    package_items: [...ORIENTATION_PACKAGE_ITEMS],
  };
}

export function normalizeHireDetails(input: Partial<HireDetails> | null | undefined): HireDetails {
  const base = emptyHireDetails();
  if (!input) return base;
  return {
    ...base,
    ...input,
    compliance: { ...base.compliance, ...(input.compliance ?? {}) },
    package_items:
      input.package_items && input.package_items.length > 0
        ? input.package_items
        : base.package_items,
  };
}

export function getComplianceProgress(details: HireDetails) {
  const items = Object.values(details.compliance);
  const cleared = items.filter((s) => s === "cleared" || s === "waived").length;
  return { cleared, total: items.length, percent: Math.round((cleared / items.length) * 100) };
}

export function isOrientationPackageReady(details: HireDetails) {
  return Boolean(
    details.facility_name &&
      details.start_date &&
      details.orientation_date &&
      details.reporting_manager,
  );
}

export function getHireReadinessScore(details: HireDetails) {
  const compliance = getComplianceProgress(details);
  const requiredFields = [
    details.facility_name,
    details.start_date,
    details.shift_schedule,
    details.orientation_date,
    details.reporting_manager,
    details.emergency_contact_name,
  ];
  const filled = requiredFields.filter(Boolean).length;
  const fieldScore = Math.round((filled / requiredFields.length) * 100);
  return Math.round((compliance.percent + fieldScore) / 2);
}
