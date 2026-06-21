/** Local healthcare photography — bundled in /public/images/healthcare */
export const healthcareImages = {
  heroTeam: {
    src: "/images/healthcare/hero-team.jpg",
    alt: "Healthcare professionals collaborating in a clinical setting",
  },
  homeCare: {
    src: "/images/healthcare/home-care.jpg",
    alt: "Home care nurse supporting a patient",
  },
  hospitalCare: {
    src: "/images/healthcare/hospital-doctor.jpg",
    alt: "Doctor providing compassionate hospital care",
  },
  clinicalTeam: {
    src: "/images/healthcare/clinical-team.jpg",
    alt: "Medical team reviewing patient care plans",
  },
  seniorLiving: {
    src: "/images/healthcare/senior-living.jpg",
    alt: "Caregiver supporting a resident in senior living",
  },
  hospitalWard: {
    src: "/images/healthcare/hospital-ward.jpg",
    alt: "Modern hospital ward with clinical staff",
  },
  nursingCare: {
    src: "/images/healthcare/nursing-care.jpg",
    alt: "Nurse delivering hands-on patient care",
  },
  patientConsult: {
    src: "/images/healthcare/patient-consult.jpg",
    alt: "Healthcare provider consulting with a patient",
  },
  medicalStaff: {
    src: "/images/healthcare/medical-staff.jpg",
    alt: "Medical staff coordinating care in a facility",
  },
  caregiverSupport: {
    src: "/images/healthcare/caregiver.jpg",
    alt: "Caregiver assisting a senior at home",
  },
} as const;

export type HealthcareImageKey = keyof typeof healthcareImages;

/** Images used on the homepage — each key appears at most once */
export const homePageImageKeys = [
  "heroTeam",
  "homeCare",
  "hospitalCare",
  "clinicalTeam",
  "seniorLiving",
  "hospitalWard",
  "nursingCare",
  "patientConsult",
] as const satisfies readonly HealthcareImageKey[];
