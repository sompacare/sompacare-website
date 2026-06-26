import {
  careerPositions,
  faqs,
  homeCareServices,
  hrSolutions,
  siteConfig,
  staffingServices,
} from "./data";

const ORG_ID = `${siteConfig.url}/#organization`;
const WEBSITE_ID = `${siteConfig.url}/#website`;

function graph(...nodes: Record<string, unknown>[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}

export function organizationSchema() {
  return {
    "@type": ["Organization", "EmploymentAgency", "MedicalBusiness"],
    "@id": ORG_ID,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/opengraph-image`,
    image: `${siteConfig.url}/opengraph-image`,
    description: siteConfig.description,
    telephone: siteConfig.phoneHref.replace("tel:", ""),
    email: siteConfig.email,
    areaServed: {
      "@type": "Country",
      name: "United States",
    },
    knowsAbout: [
      "Healthcare Staffing",
      "Healthcare Staffing Agency",
      "Medical Staffing Agency",
      "Healthcare Workforce Solutions",
      "Nurse Staffing Agency",
      "Healthcare Recruitment",
      "RN Staffing",
      "LPN Staffing",
      "CNA Staffing",
      "Travel Nurse Staffing",
      "Per Diem Nursing",
      "Hospital Staffing",
      "In-Home Care Services",
      "Healthcare HR Solutions",
      "Healthcare Credentialing",
    ],
    makesOffer: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Healthcare Staffing" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Nurse Staffing" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Travel Nurse Staffing" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "In-Home Care" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Healthcare Workforce Solutions" } },
    ],
    sameAs: [],
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: { "@id": ORG_ID },
    inLanguage: "en-US",
  };
}

export function globalSchema() {
  return graph(organizationSchema(), websiteSchema());
}

export function webPageSchema({
  path,
  name,
  description,
}: {
  path: string;
  name: string;
  description: string;
}) {
  return {
    "@type": "WebPage",
    "@id": `${siteConfig.url}${path}#webpage`,
    url: `${siteConfig.url}${path}`,
    name,
    description,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
    inLanguage: "en-US",
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.path}`,
    })),
  };
}

export function faqPageSchema() {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function serviceSchema({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@type": "Service",
    name,
    description,
    url: `${siteConfig.url}${path}`,
    provider: { "@id": ORG_ID },
    areaServed: {
      "@type": "Country",
      name: "United States",
    },
    serviceType: name,
  };
}

export function homePageSchema() {
  return graph(
    webPageSchema({
      path: "/",
      name: "Healthcare Staffing & Nurse Staffing Agency",
      description: siteConfig.description,
    }),
    faqPageSchema(),
    ...staffingServices.slice(0, 4).map((service) =>
      serviceSchema({
        name: service.title,
        description: service.description,
        path: service.href,
      }),
    ),
  );
}

export function staffingPageSchema() {
  return graph(
    webPageSchema({
      path: "/staffing",
      name: "Nurse Staffing Agency & Healthcare Staffing",
      description:
        "RN, LPN, CNA, travel nurse, per diem, and permanent placement staffing from a trusted nurse staffing agency serving healthcare facilities nationwide.",
    }),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Healthcare Staffing", path: "/staffing" },
    ]),
    ...staffingServices.map((service) =>
      serviceSchema({
        name: service.title,
        description: service.description,
        path: service.href,
      }),
    ),
  );
}

export function servicesPageSchema() {
  return graph(
    webPageSchema({
      path: "/services",
      name: "Medical Staffing Agency Services",
      description:
        "Full-service medical staffing agency offering healthcare recruitment, clinical staffing, and workforce solutions for hospitals and care facilities.",
    }),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Services", path: "/services" },
    ]),
    serviceSchema({
      name: "Healthcare Recruitment",
      description:
        "Full-cycle healthcare recruitment campaigns targeting top clinical and allied talent nationwide.",
      path: "/services#recruitment",
    }),
    serviceSchema({
      name: "Medical Staffing Agency Services",
      description:
        "Comprehensive medical staffing agency solutions for hospitals, nursing homes, and healthcare organizations.",
      path: "/services",
    }),
  );
}

export function homeCarePageSchema() {
  return graph(
    webPageSchema({
      path: "/home-care",
      name: "In-Home Care Services",
      description:
        "Sompacare home care nationwide — personal support, memory care, clinical visits, and family respite delivered in the comfort of home.",
    }),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Home Care", path: "/home-care" },
    ]),
    ...homeCareServices.map((service) =>
      serviceSchema({
        name: service.title,
        description: service.description,
        path: `/home-care#${service.id}`,
      }),
    ),
  );
}

export function hrSolutionsPageSchema() {
  return graph(
    webPageSchema({
      path: "/hr-solutions",
      name: "Healthcare Workforce Solutions",
      description:
        "Enterprise healthcare workforce solutions including talent acquisition, compliance, credential verification, and workforce planning.",
    }),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "HR Solutions", path: "/hr-solutions" },
    ]),
    ...hrSolutions.map((solution) =>
      serviceSchema({
        name: solution.title,
        description: solution.description,
        path: `/hr-solutions#${solution.title.toLowerCase().replace(/\s+/g, "-")}`,
      }),
    ),
  );
}

export function aboutPageSchema() {
  return graph(
    webPageSchema({
      path: "/about",
      name: "About Sompacare",
      description:
        "Learn about Sompacare, a trusted medical staffing agency and healthcare workforce solutions partner serving organizations nationwide.",
    }),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "About", path: "/about" },
    ]),
  );
}

export function contactPageSchema() {
  return graph(
    webPageSchema({
      path: "/contact",
      name: "Contact Sompacare",
      description:
        "Contact our healthcare staffing and nurse staffing agency team for staffing requests, recruitment support, and workforce consultations.",
    }),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Contact", path: "/contact" },
    ]),
    {
      "@type": "ContactPage",
      url: `${siteConfig.url}/contact`,
      mainEntity: { "@id": ORG_ID },
    },
    faqPageSchema(),
  );
}

export function careersPageSchema() {
  return graph(
    webPageSchema({
      path: "/careers",
      name: "Healthcare Careers",
      description:
        "Join Sompacare's healthcare workforce. Apply for RN, LPN, CNA, and healthcare recruitment roles with competitive pay and flexible assignments.",
    }),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Careers", path: "/careers" },
    ]),
    ...careerPositions.map((role) => ({
      "@type": "JobPosting",
      title: role.title,
      description: role.description,
      identifier: {
        "@type": "PropertyValue",
        name: siteConfig.name,
        value: role.id,
      },
      hiringOrganization: { "@id": ORG_ID },
      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressCountry: "US",
        },
      },
      employmentType: "FULL_TIME",
      applicantLocationRequirements: {
        "@type": "Country",
        name: "United States",
      },
      url: `${siteConfig.url}/careers#apply-${role.id}`,
    })),
  );
}

export function pageGraph(...nodes: Record<string, unknown>[]) {
  return graph(...nodes);
}
