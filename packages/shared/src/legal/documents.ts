import { LEGAL_DOCUMENT_VERSION, LegalDocumentType, type LegalDocumentContent } from "./types";

const EFFECTIVE = "July 13, 2026";

export const PRIVACY_POLICY: LegalDocumentContent = {
  type: LegalDocumentType.PRIVACY_POLICY,
  version: LEGAL_DOCUMENT_VERSION,
  title: "Privacy Policy",
  effectiveDate: EFFECTIVE,
  summary:
    "How Sompacare collects, uses, and protects personal information across our staffing platform, careers site, and mobile applications.",
  sections: [
    {
      id: "overview",
      title: "Overview",
      body: "Sompacare, LLC (\"Sompacare,\" \"we,\" \"us\") provides healthcare staffing and workforce technology services. This Privacy Policy describes how we collect, use, disclose, and safeguard personal information when you visit our website, apply for positions, use our clinician or facility portals, or interact with our mobile applications.",
    },
    {
      id: "information-we-collect",
      title: "Information We Collect",
      body: "We may collect: identity and contact information (name, email, phone, address); professional credentials (licenses, certifications, resumes); employment and scheduling data; geolocation data when you clock in or out of shifts (with your consent); payment and tax information for payroll; device and usage data; and communications you send to us. Careers applications may include background-check-related information when you proceed through screening.",
    },
    {
      id: "how-we-use",
      title: "How We Use Information",
      body: "We use personal information to operate staffing services, verify credentials and compliance, match clinicians to shifts, process payroll and payments, communicate about assignments, improve platform security, meet legal obligations, and — with appropriate consent — conduct employment-related background screening through our screening partners.",
    },
    {
      id: "sharing",
      title: "How We Share Information",
      body: "We share information with healthcare facilities for staffing purposes, with service providers that help us operate the platform (hosting, email, payments, background screening, identity verification), and when required by law. We do not sell personal information. Facility partners receive only the information needed to evaluate and manage assigned clinicians.",
    },
    {
      id: "retention-security",
      title: "Retention & Security",
      body: "We retain information as long as needed to provide services, meet legal requirements, and resolve disputes. We apply administrative, technical, and organizational safeguards including access controls, encryption in transit, audit logging, and role-based permissions. No method of transmission or storage is completely secure.",
    },
    {
      id: "your-rights",
      title: "Your Choices & Rights",
      body: "Depending on your location, you may have rights to access, correct, delete, or restrict certain processing of your personal information. Clinicians can update profile and credential data in the nurse portal. To exercise privacy rights, contact privacy@sompacare.com.",
    },
    {
      id: "children",
      title: "Children",
      body: "Our services are intended for adults in professional healthcare roles. We do not knowingly collect information from children under 16.",
    },
    {
      id: "changes-contact",
      title: "Changes & Contact",
      body: "We may update this policy and will post the revised version with a new effective date. Material changes may be communicated by email or in-app notice. Questions: privacy@sompacare.com or Sompacare, LLC, Maryland, USA.",
    },
  ],
};

export const TERMS_OF_SERVICE: LegalDocumentContent = {
  type: LegalDocumentType.TERMS_OF_SERVICE,
  version: LEGAL_DOCUMENT_VERSION,
  title: "Terms of Service",
  effectiveDate: EFFECTIVE,
  summary:
    "Terms governing use of Sompacare websites, portals, and staffing platform services.",
  sections: [
    {
      id: "agreement",
      title: "Agreement",
      body: "By accessing Sompacare websites, applying for roles, or using our clinician, facility, recruiter, or admin portals, you agree to these Terms of Service and our Privacy Policy. If you use the platform on behalf of an organization, you represent that you have authority to bind that organization.",
    },
    {
      id: "services",
      title: "Services",
      body: "Sompacare provides healthcare staffing, scheduling, compliance, timekeeping, and related workforce technology. Features may change over time. We may suspend access for maintenance, security incidents, or violations of these terms.",
    },
    {
      id: "accounts",
      title: "Accounts & Eligibility",
      body: "You must provide accurate information and maintain the security of your credentials. Clinicians must hold valid licenses and credentials required for assigned roles. Facilities are responsible for supervising clinicians and complying with applicable laws in their jurisdictions.",
    },
    {
      id: "acceptable-use",
      title: "Acceptable Use",
      body: "You may not misuse the platform, attempt unauthorized access, interfere with other users, upload malicious content, misrepresent credentials, or use the service for unlawful discrimination or harassment. We may investigate and terminate access for violations.",
    },
    {
      id: "payments",
      title: "Payments & Independent Contractor Status",
      body: "Pay rates, bonuses, and payment timing are disclosed per assignment or contract. Unless otherwise agreed in writing, clinicians engaged through Sompacare are independent contractors, not employees of Sompacare or the facility. Tax obligations remain with each party as applicable.",
    },
    {
      id: "compliance-screening",
      title: "Compliance & Background Screening",
      body: "Clinicians may be required to complete credential verification and background screening before working shifts. Screening is conducted by third-party providers under separate disclosures and authorizations. Facilities and clinicians must cooperate with compliance requirements.",
    },
    {
      id: "liability",
      title: "Disclaimers & Limitation of Liability",
      body: "The platform is provided \"as is\" to the extent permitted by law. Sompacare does not guarantee uninterrupted service. To the maximum extent permitted by law, Sompacare is not liable for indirect, incidental, or consequential damages arising from platform use.",
    },
    {
      id: "governing-law",
      title: "Governing Law & Contact",
      body: "These terms are governed by the laws of the State of Maryland, without regard to conflict-of-law rules. Disputes will be resolved in Maryland courts unless otherwise required by law. Contact: legal@sompacare.com.",
    },
  ],
};

export const BACKGROUND_CHECK_DISCLOSURE: LegalDocumentContent = {
  type: LegalDocumentType.BACKGROUND_CHECK_DISCLOSURE,
  version: LEGAL_DOCUMENT_VERSION,
  title: "Background Check Disclosure & Authorization",
  effectiveDate: EFFECTIVE,
  summary:
    "Summary of your rights under the Fair Credit Reporting Act (FCRA) when Sompacare orders a consumer report for employment purposes.",
  sections: [
    {
      id: "disclosure",
      title: "Disclosure",
      body: "Sompacare may obtain a consumer report and/or investigative consumer report about you from a consumer reporting agency for employment purposes, including through our screening partner Checkr, Inc. This may include criminal history, employment verification, education verification, motor vehicle records, and other information permitted by law.",
    },
    {
      id: "authorization",
      title: "Authorization",
      body: "By authorizing a background check, you provide written consent for Sompacare and its screening partners to obtain consumer reports and investigative consumer reports about you for employment purposes. You certify that information you provide is accurate and complete.",
    },
    {
      id: "fcra-rights",
      title: "Your FCRA Rights",
      body: "You have the right to request disclosure of the nature and scope of any investigative consumer report. If adverse action is taken based on a consumer report, you will receive required notices including a copy of the report and a summary of your rights under the FCRA.",
    },
    {
      id: "checkr",
      title: "Screening Partner",
      body: "Reports may be prepared by Checkr, Inc., One Montgomery Street, Suite 2400, San Francisco, CA 94104 | checkr.com | applicant checkr.com/applicant for copies of reports.",
    },
  ],
};

export const LEGAL_DOCUMENTS: Record<LegalDocumentType, LegalDocumentContent> = {
  [LegalDocumentType.PRIVACY_POLICY]: PRIVACY_POLICY,
  [LegalDocumentType.TERMS_OF_SERVICE]: TERMS_OF_SERVICE,
  [LegalDocumentType.BACKGROUND_CHECK_DISCLOSURE]: BACKGROUND_CHECK_DISCLOSURE,
};

export function getLegalDocument(type: LegalDocumentType): LegalDocumentContent {
  return LEGAL_DOCUMENTS[type];
}
