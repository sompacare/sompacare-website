export const STAFFING_ROLE_OPTIONS = [
  { value: "rn", label: "Registered Nurse (RN)" },
  { value: "lpn", label: "Licensed Practical Nurse (LPN)" },
  { value: "cna", label: "Certified Nursing Assistant (CNA)" },
  { value: "gna", label: "Geriatric Nursing Assistant (GNA)" },
  { value: "cma", label: "Certified Medical Assistant (CMA)" },
  { value: "med-tech", label: "Medication Technician (Med Tech)" },
  { value: "multiple", label: "Multiple roles / Mixed staff" },
] as const;

export type StaffingRole = (typeof STAFFING_ROLE_OPTIONS)[number]["value"];
export type StaffingUrgency = "urgent" | "soon" | "planned";

export type StaffingFormData = {
  contactName: string;
  organization: string;
  email: string;
  phone: string;
  roleNeeded: StaffingRole;
  numberNeeded: string;
  shiftDetails: string;
  startDate: string;
  urgency: StaffingUrgency;
  message: string;
};

export type StaffingFormErrors = Partial<Record<keyof StaffingFormData | "form", string>>;

const PHONE_PATTERN = /^[+]?[\d\s().-]{10,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_ROLES = new Set(STAFFING_ROLE_OPTIONS.map((r) => r.value));
const VALID_URGENCY = new Set(["urgent", "soon", "planned"]);

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getStaffingRoleLabel(value: string): string {
  return STAFFING_ROLE_OPTIONS.find((r) => r.value === value)?.label ?? value;
}

export function getStaffingUrgencyLabel(value: StaffingUrgency): string {
  const labels: Record<StaffingUrgency, string> = {
    urgent: "Urgent — within 24 hours",
    soon: "Within 1 week",
    planned: "Planned — 2+ weeks out",
  };
  return labels[value];
}

export function validateStaffingForm(input: unknown):
  | { success: true; data: StaffingFormData }
  | { success: false; errors: StaffingFormErrors } {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const errors: StaffingFormErrors = {};

  const contactName = clean(raw.contactName);
  const organization = clean(raw.organization);
  const email = clean(raw.email);
  const phone = clean(raw.phone);
  const roleNeeded = clean(raw.roleNeeded);
  const numberNeeded = clean(raw.numberNeeded);
  const shiftDetails = clean(raw.shiftDetails);
  const startDate = clean(raw.startDate);
  const urgency = clean(raw.urgency);
  const message = clean(raw.message);

  if (!contactName) errors.contactName = "Contact name is required.";
  else if (contactName.length < 2) errors.contactName = "Contact name must be at least 2 characters.";

  if (!organization) errors.organization = "Facility / organization name is required.";

  if (!email) errors.email = "Email is required.";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email address.";

  if (!phone) errors.phone = "Phone number is required.";
  else if (!PHONE_PATTERN.test(phone)) errors.phone = "Enter a valid phone number.";
  else if (phone.replace(/\D/g, "").length < 10) errors.phone = "Phone number must include at least 10 digits.";

  if (!roleNeeded || !VALID_ROLES.has(roleNeeded as StaffingRole)) {
    errors.roleNeeded = "Please select the staff type needed.";
  }

  if (!numberNeeded) errors.numberNeeded = "Number of staff needed is required.";
  else if (!/^\d+$/.test(numberNeeded) || Number(numberNeeded) < 1) {
    errors.numberNeeded = "Enter a valid number (1 or more).";
  }

  if (!shiftDetails) errors.shiftDetails = "Shift details are required.";
  if (!startDate) errors.startDate = "Estimated start date is required.";
  if (!urgency || !VALID_URGENCY.has(urgency)) errors.urgency = "Please select urgency level.";

  if (!message) errors.message = "Please describe your staffing need.";
  else if (message.length < 10) errors.message = "Message must be at least 10 characters.";

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      contactName,
      organization,
      email,
      phone,
      roleNeeded: roleNeeded as StaffingRole,
      numberNeeded,
      shiftDetails,
      startDate,
      urgency: urgency as StaffingUrgency,
      message,
    },
  };
}
