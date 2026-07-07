import type { HireDetails } from "@/lib/hire-orientation";

export type ApplicationStatus = "new" | "reviewing" | "interviewed" | "hired" | "rejected";

export type CertificationFile = {
  url: string;
  fileName: string;
};

export type ApplicationRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_line1: string;
  city: string;
  state: string;
  zip: string;
  position: string;
  position_label: string;
  license_number: string | null;
  license_state: string | null;
  certifications: string[];
  experience: string;
  availability: string;
  additional_notes: string | null;
  resume_url: string | null;
  resume_file_name: string | null;
  certification_urls: CertificationFile[];
  status: ApplicationStatus;
  onboarding_sent_at: string | null;
  hire_details: HireDetails;
  orientation_package_sent_at: string | null;
};
