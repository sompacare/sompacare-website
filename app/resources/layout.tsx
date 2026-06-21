import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Healthcare Workforce Resource Center",
  description:
    "Free guides, whitepapers, tools, and reports on healthcare staffing, credentialing, workforce planning, and nurse retention from Sompacare.",
  path: "/resources",
  keywords: ["Healthcare Workforce Solutions", "Healthcare Staffing", "Medical Staffing Agency"],
});

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
