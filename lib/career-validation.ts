import {
  APPLICATION_POSITIONS,
  CERTIFICATION_OPTIONS,
  US_STATES,
} from "./careers";
import { isAllowedCertMime, isAllowedResumeMime, resolveFileMime } from "@/lib/file-mime";

export type CareerAvailability =
  | "full-time"
  | "part-time"
  | "per-diem"
  | "contract"
  | "flexible";

export type CareerExperience = "0-1" | "1-3" | "3-5" | "5-10" | "10+";

export type CareerFormFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  position: string;
  licenseNumber: string;
  licenseState: string;
  certifications: string[];
  certificationOther: string;
  experience: CareerExperience;
  availability: CareerAvailability;
  additionalNotes: string;
};

export type CareerFormErrors = Partial<
  Record<keyof CareerFormFields | "form" | "resume" | "certificationFiles" | "certifications", string>
>;

const NAME_PATTERN = /^[a-zA-Z' -]+$/;
const PHONE_PATTERN = /^[+]?[\d\s().-]{10,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_PATTERN = /^\d{5}(-\d{4})?$/;

const VALID_POSITIONS = APPLICATION_POSITIONS.map((p) => p.id);
const VALID_EXPERIENCE = new Set(["0-1", "1-3", "3-5", "5-10", "10+"]);
const VALID_AVAILABILITY = new Set([
  "full-time",
  "part-time",
  "per-diem",
  "contract",
  "flexible",
]);
const VALID_STATES = new Set<string>(US_STATES);
const VALID_CERTS = new Set<string>(CERTIFICATION_OPTIONS);

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getPositionLabel(positionId: string): string {
  return APPLICATION_POSITIONS.find((role) => role.id === positionId)?.title ?? positionId;
}

export function getExperienceLabel(value: CareerExperience): string {
  const labels: Record<CareerExperience, string> = {
    "0-1": "Less than 1 year",
    "1-3": "1–3 years",
    "3-5": "3–5 years",
    "5-10": "5–10 years",
    "10+": "10+ years",
  };
  return labels[value];
}

export function getAvailabilityLabel(value: CareerAvailability): string {
  const labels: Record<CareerAvailability, string> = {
    "full-time": "Full-Time",
    "part-time": "Part-Time",
    "per-diem": "Per Diem",
    contract: "Contract / Travel",
    flexible: "Flexible",
  };
  return labels[value];
}

function parseCertifications(raw: FormData | Record<string, unknown>): string[] {
  if (raw instanceof FormData) {
    return raw.getAll("certifications").map((v) => clean(v)).filter(Boolean);
  }
  const value = (raw as Record<string, unknown>).certifications;
  if (Array.isArray(value)) return value.map((v) => clean(v)).filter(Boolean);
  if (typeof value === "string" && value) return [value];
  return [];
}

export function validateCareerFields(input: FormData | Record<string, unknown>):
  | { success: true; data: CareerFormFields }
  | { success: false; errors: CareerFormErrors } {
  const get = (key: string) =>
    input instanceof FormData ? clean(input.get(key)) : clean((input as Record<string, unknown>)[key]);

  const errors: CareerFormErrors = {};

  const firstName = get("firstName");
  const lastName = get("lastName");
  const email = get("email");
  const phone = get("phone");
  const addressLine1 = get("addressLine1");
  const city = get("city");
  const state = get("state").toUpperCase();
  const zip = get("zip");
  const position = get("position");
  const licenseNumber = get("licenseNumber");
  const licenseState = get("licenseState").toUpperCase();
  const certifications = parseCertifications(input);
  const certificationOther = get("certificationOther");
  const experience = get("experience");
  const availability = get("availability");
  const additionalNotes = get("additionalNotes");

  if (!firstName) errors.firstName = "First name is required.";
  else if (firstName.length < 2) errors.firstName = "First name must be at least 2 characters.";
  else if (!NAME_PATTERN.test(firstName)) errors.firstName = "First name contains invalid characters.";

  if (!lastName) errors.lastName = "Last name is required.";
  else if (lastName.length < 2) errors.lastName = "Last name must be at least 2 characters.";
  else if (!NAME_PATTERN.test(lastName)) errors.lastName = "Last name contains invalid characters.";

  if (!email) errors.email = "Email is required.";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email address.";

  if (!phone) errors.phone = "Phone number is required.";
  else if (!PHONE_PATTERN.test(phone)) errors.phone = "Enter a valid phone number.";
  else if (phone.replace(/\D/g, "").length < 10) errors.phone = "Phone number must include at least 10 digits.";

  if (!addressLine1) errors.addressLine1 = "Street address is required.";
  if (!city) errors.city = "City is required.";
  if (!state || !VALID_STATES.has(state)) errors.state = "Select a valid state.";
  if (!zip || !ZIP_PATTERN.test(zip)) errors.zip = "Enter a valid ZIP code.";

  if (!position) errors.position = "Please select a position.";
  else if (!VALID_POSITIONS.includes(position as (typeof VALID_POSITIONS)[number])) {
    errors.position = "Please select a valid position.";
  }

  const role = APPLICATION_POSITIONS.find((p) => p.id === position);
  if (role?.requiresLicense) {
    if (!licenseNumber) errors.licenseNumber = "License / certification number is required.";
    if (!licenseState || !VALID_STATES.has(licenseState)) {
      errors.licenseState = "License state is required.";
    }
  }

  if (certifications.length === 0) {
    errors.certifications = "Select at least one certification.";
  } else {
    for (const cert of certifications) {
      if (!VALID_CERTS.has(cert)) {
        errors.certifications = "Invalid certification selected.";
        break;
      }
    }
    if (certifications.includes("Other") && !certificationOther) {
      errors.certificationOther = "Please describe your other certification.";
    }
  }

  if (!experience || !VALID_EXPERIENCE.has(experience)) {
    errors.experience = "Please select your years of experience.";
  }

  if (!availability || !VALID_AVAILABILITY.has(availability)) {
    errors.availability = "Please select your availability.";
  }

  if (additionalNotes.length > 3000) {
    errors.additionalNotes = "Additional notes must be 3000 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const certList = certifications.includes("Other") && certificationOther
    ? [...certifications.filter((c) => c !== "Other"), `Other: ${certificationOther}`]
    : certifications;

  return {
    success: true,
    data: {
      firstName,
      lastName,
      email,
      phone,
      addressLine1,
      city,
      state,
      zip,
      position,
      licenseNumber,
      licenseState,
      certifications: certList,
      certificationOther,
      experience: experience as CareerExperience,
      availability: availability as CareerAvailability,
      additionalNotes,
    },
  };
}

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const MAX_CERT_BYTES = 10 * 1024 * 1024;
const MAX_CERT_FILES = 5;

export function validateCareerFiles(formData: FormData):
  | { success: true; resume: File; certificationFiles: File[] }
  | { success: false; errors: CareerFormErrors } {
  const errors: CareerFormErrors = {};
  const resume = formData.get("resume");

  if (!(resume instanceof File) || resume.size === 0) {
    errors.resume = "Resume is required (PDF or Word, max 5 MB).";
  } else if (resume.size > MAX_RESUME_BYTES) {
    errors.resume = "Resume must be 5 MB or smaller.";
  } else if (!isAllowedResumeMime(resolveFileMime(resume))) {
    errors.resume = "Resume must be a PDF or Word document.";
  }

  const certificationFiles = formData
    .getAll("certificationFiles")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (certificationFiles.length > MAX_CERT_FILES) {
    errors.certificationFiles = `Upload up to ${MAX_CERT_FILES} certification files.`;
  }

  for (const file of certificationFiles) {
    if (file.size > MAX_CERT_BYTES) {
      errors.certificationFiles = `"${file.name}" exceeds the 10 MB file size limit.`;
      break;
    }
    if (!isAllowedCertMime(resolveFileMime(file))) {
      errors.certificationFiles = `"${file.name}" is not an allowed file type.`;
      break;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    resume: resume as File,
    certificationFiles,
  };
}

/** @deprecated Use validateCareerFields */
export function validateCareerForm(input: unknown) {
  return validateCareerFields(
    input && typeof input === "object" ? (input as Record<string, unknown>) : {},
  );
}

export type CareerFormData = CareerFormFields & { resumeNotes?: string };
