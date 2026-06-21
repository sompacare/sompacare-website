import type { Metadata } from "next";
import { siteConfig } from "./data";

export const SEO_KEYWORDS = [
  "Healthcare Staffing",
  "Medical Staffing Agency",
  "Healthcare Workforce Solutions",
  "Nurse Staffing Agency",
  "Healthcare Recruitment",
  "RN Staffing",
  "LPN Staffing",
  "CNA Staffing",
  "Travel Nurses",
  "Per Diem Staffing",
  "Permanent Placement",
  "Healthcare HR",
  "Credential Verification",
  "Healthcare Compliance",
  "Clinical Staffing",
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
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
    category: "Healthcare",
  };
}

export const defaultSiteMetadata: Metadata = {
  title: {
    default: `${siteConfig.name} | Healthcare Staffing & Nurse Staffing Agency`,
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
    title: `${siteConfig.name} | Healthcare Staffing & Nurse Staffing Agency`,
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
    title: `${siteConfig.name} | Healthcare Staffing & Nurse Staffing Agency`,
    description: siteConfig.description,
    images: [ogImageUrl()],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  category: "Healthcare",
};
