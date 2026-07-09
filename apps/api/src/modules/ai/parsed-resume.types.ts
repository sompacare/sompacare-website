import type { ClinicalRole } from "@sompacare/database";

export type ParsedResume = {
  clinicalRole?: ClinicalRole;
  yearsExperience?: number;
  specialties?: string[];
  licenses?: Array<{ type: string; state: string; number?: string }>;
  certifications?: string[];
  skills?: string[];
  summary?: string;
};
