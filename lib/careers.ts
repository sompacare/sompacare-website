export const APPLICATION_POSITIONS = [
  {
    id: "cna",
    title: "Certified Nursing Assistant (CNA)",
    category: "Clinical",
    employment: "Per Diem · Part-Time · Full-Time",
    locations: "Nursing homes, assisted living, hospitals — Nationwide",
    description:
      "Provide hands-on bedside care, vital signs, and daily living support under the supervision of licensed nurses in long-term care and acute settings.",
    requirements: [
      "Active CNA certification in your state",
      "CPR/BLS certification",
      "Reliable attendance and compassionate bedside manner",
    ],
    requiresLicense: true,
  },
  {
    id: "gna",
    title: "Geriatric Nursing Assistant (GNA)",
    category: "Clinical",
    employment: "Per Diem · Part-Time · Full-Time",
    locations: "Skilled nursing and geriatric care facilities — Nationwide",
    description:
      "Support elderly residents with activities of daily living, mobility, and comfort in skilled nursing and geriatric care environments.",
    requirements: [
      "Active GNA certification (Maryland) or equivalent state credential",
      "CPR/BLS certification",
      "Experience in geriatric or long-term care preferred",
    ],
    requiresLicense: true,
  },
  {
    id: "cma",
    title: "Certified Medical Assistant (CMA)",
    category: "Allied Health",
    employment: "Part-Time · Full-Time · Contract",
    locations: "Clinics, physician offices, outpatient centers — Nationwide",
    description:
      "Assist providers with patient intake, vitals, rooming, and clinical support in outpatient and ambulatory care settings.",
    requirements: [
      "CMA certification or equivalent medical assistant credential",
      "BLS certification",
      "EHR and patient intake experience",
    ],
    requiresLicense: true,
  },
  {
    id: "med-tech",
    title: "Medication Technician (Med Tech)",
    category: "Clinical",
    employment: "Per Diem · Part-Time · Full-Time",
    locations: "Assisted living, skilled nursing — Nationwide",
    description:
      "Administer medications and document treatments according to facility protocols under appropriate nursing oversight.",
    requirements: [
      "Active Med Tech certification for your state",
      "CPR/BLS certification",
      "Medication administration competency and attention to detail",
    ],
    requiresLicense: true,
  },
  {
    id: "lpn",
    title: "Licensed Practical Nurse (LPN)",
    category: "Clinical",
    employment: "Per Diem · Contract · Full-Time",
    locations: "Skilled nursing, rehab, clinics — Nationwide",
    description:
      "Deliver skilled nursing care including medication administration, wound care, and patient assessments in facility and clinic settings.",
    requirements: [
      "Active, unencumbered LPN/LVN license",
      "BLS certification",
      "Minimum 6 months of clinical experience",
    ],
    requiresLicense: true,
  },
  {
    id: "rn",
    title: "Registered Nurse (RN)",
    category: "Clinical",
    employment: "Per Diem · Contract · Travel · Full-Time",
    locations: "Hospitals, acute care, specialty units — Nationwide",
    description:
      "Provide comprehensive nursing care across hospital units, specialty departments, and critical care environments with full clinical autonomy.",
    requirements: [
      "Active, unencumbered RN license",
      "BLS certification (ACLS preferred for specialty units)",
      "Minimum 1 year of acute or specialty nursing experience",
    ],
    requiresLicense: true,
  },
] as const;

/** @deprecated Use APPLICATION_POSITIONS — kept for schema/SEO compatibility */
export const careerPositions = APPLICATION_POSITIONS;

export const CERTIFICATION_OPTIONS = [
  "BLS",
  "CPR",
  "ACLS",
  "CNA",
  "GNA",
  "CMA",
  "Med Tech",
  "RN License",
  "LPN License",
  "First Aid",
  "Other",
] as const;

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
] as const;

export const SERVICE_REGION_STATES = US_STATES;

/** @deprecated Use US_STATES — Sompacare serves clients nationwide */
export const NORTHEAST_STATES = US_STATES;
