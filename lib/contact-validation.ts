export const CONTACT_SERVICES = [
  { value: "home-care", label: "In-Home Care Inquiry" },
  { value: "hr", label: "HR & Workforce Solutions" },
  { value: "consultation", label: "General Consultation" },
  { value: "partnership", label: "Partnership Inquiry" },
  { value: "other", label: "Other" },
] as const;

export type ContactService = (typeof CONTACT_SERVICES)[number]["value"];

export type ContactFormData = {
  firstName: string;
  lastName: string;
  organization: string;
  email: string;
  phone: string;
  service: ContactService;
  message: string;
};

export type ContactFormErrors = Partial<Record<keyof ContactFormData | "form", string>>;

const NAME_PATTERN = /^[a-zA-Z' -]+$/;
const PHONE_PATTERN = /^[+]?[\d\s().-]{10,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getServiceLabel(service: ContactService): string {
  return CONTACT_SERVICES.find((item) => item.value === service)?.label ?? service;
}

export function validateContactForm(input: unknown):
  | { success: true; data: ContactFormData }
  | { success: false; errors: ContactFormErrors } {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const errors: ContactFormErrors = {};

  const firstName = clean(raw.firstName);
  const lastName = clean(raw.lastName);
  const organization = clean(raw.organization);
  const email = clean(raw.email);
  const phone = clean(raw.phone);
  const service = clean(raw.service);
  const message = clean(raw.message);

  if (!firstName) errors.firstName = "First name is required.";
  else if (firstName.length < 2) errors.firstName = "First name must be at least 2 characters.";
  else if (firstName.length > 50) errors.firstName = "First name must be 50 characters or fewer.";
  else if (!NAME_PATTERN.test(firstName)) errors.firstName = "First name contains invalid characters.";

  if (!lastName) errors.lastName = "Last name is required.";
  else if (lastName.length < 2) errors.lastName = "Last name must be at least 2 characters.";
  else if (lastName.length > 50) errors.lastName = "Last name must be 50 characters or fewer.";
  else if (!NAME_PATTERN.test(lastName)) errors.lastName = "Last name contains invalid characters.";

  if (!organization) errors.organization = "Organization is required.";
  else if (organization.length < 2) errors.organization = "Organization must be at least 2 characters.";
  else if (organization.length > 100) errors.organization = "Organization must be 100 characters or fewer.";

  if (!email) errors.email = "Email is required.";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email address.";
  else if (email.length > 254) errors.email = "Email must be 254 characters or fewer.";

  if (!phone) errors.phone = "Phone number is required.";
  else if (!PHONE_PATTERN.test(phone)) errors.phone = "Enter a valid phone number.";
  else if (phone.replace(/\D/g, "").length < 10) errors.phone = "Phone number must include at least 10 digits.";

  const validService = CONTACT_SERVICES.some((item) => item.value === service);
  if (!service) errors.service = "Please select a service.";
  else if (!validService) errors.service = "Please select a valid service.";

  if (!message) errors.message = "Message is required.";
  else if (message.length < 10) errors.message = "Message must be at least 10 characters.";
  else if (message.length > 2000) errors.message = "Message must be 2000 characters or fewer.";

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      firstName,
      lastName,
      organization,
      email,
      phone,
      service: service as ContactService,
      message,
    },
  };
}
