import type { Metadata } from "next";
import { siteConfig } from "./data";

export const SEO_KEYWORDS = [
  "Healthcare Staffing",
  "Healthcare Staffing Agency",
  "Medical Staffing Agency",
  "Nurse Staffing Agency",
  "Healthcare Workforce Solutions",
  "Healthcare Recruitment",
  "Clinical Staffing",
  "Hospital Staffing Agency",
  "RN Staffing",
  "LPN Staffing",
  "CNA Staffing",
  "Travel Nurse Staffing",
  "Travel Nurses",
  "Per Diem Staffing",
  "Per Diem Nursing",
  "Permanent Healthcare Placement",
  "Healthcare Staffing Company",
  "Nationwide Healthcare Staffing",
  "Senior Living Staffing",
  "Long-Term Care Staffing",
  "Skilled Nursing Staffing",
  "In-Home Care Services",
  "Home Care Agency",
  "Healthcare HR Solutions",
  "Healthcare Credentialing",
  "Healthcare Compliance Staffing",
  "Temporary Nursing Staff",
  "Contract Nursing Staff",
  "Healthcare Talent Acquisition",
  "Workforce Planning Healthcare",
] as const;

type PageSEO = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
};

function absoluteUrl(path = ""): string {
  return `${siteConfig.url}${path || "/"}`;
}

function ogImageUrl(): string {
  return absoluteUrl("/opengraph-image");
}

export function createMetadata({
  title,
  description,
  path = "",
  keywords = [...SEO_KEYWORDS],
  noIndex = false,
}: PageSEO): Metadata {
  const url = absoluteUrl(path || "/");
  const image = ogImageUrl();

  return {
    title,
    description,
    keywords,
    alternates: { canonical: path || "/" },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: siteConfig.name,
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} — ${siteConfig.tagline}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [image],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    category: "Healthcare",
  };
}

export const defaultSiteMetadata: Metadata = {
  title: {
    default: `${siteConfig.name} | Healthcare Staffing Agency, Nurse Staffing & Home Care`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...SEO_KEYWORDS],
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} | Healthcare Staffing Agency, Nurse Staffing & Home Care`,
    description: siteConfig.description,
    images: [
      {
        url: ogImageUrl(),
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — ${siteConfig.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Healthcare Staffing Agency, Nurse Staffing & Home Care`,
    description: siteConfig.description,
    images: [ogImageUrl()],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "Healthcare",
};
