import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Healthcare Staffing Blog",
  description:
    "Expert insights on healthcare staffing, nurse retention, travel nursing trends, compliance, and workforce management from Sompacare.",
  path: "/blog",
  keywords: ["Healthcare Staffing", "Healthcare Recruitment", "Healthcare Workforce Solutions"],
});

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
