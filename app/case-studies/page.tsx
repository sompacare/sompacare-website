import { SiteLayout } from "@/components/layout/SiteLayout";
import { CaseStudiesFullSection } from "@/components/sections/CaseStudiesSection";
import { ConversionCTASection } from "@/components/sections/ConversionCTASection";
import { SuccessStoriesSection } from "@/components/sections/SuccessStoriesSection";
import { PageHero } from "@/components/ui/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seo";
import { breadcrumbSchema, webPageSchema, pageGraph } from "@/lib/schema";

export const metadata = createMetadata({
  title: "Case Studies & Success Stories",
  description:
    "Explore Sompacare case studies and success stories — proven healthcare staffing outcomes for hospitals, health systems, and long-term care facilities.",
  path: "/case-studies",
  keywords: ["Healthcare Staffing", "Case Studies", "Medical Staffing Agency", "Nurse Staffing Agency"],
});

export default function CaseStudiesPage() {
  return (
    <SiteLayout>
      <JsonLd
        data={pageGraph(
          webPageSchema({
            path: "/case-studies",
            name: "Case Studies & Success Stories",
            description: "Proven healthcare staffing outcomes from Sompacare partners nationwide.",
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Case Studies", path: "/case-studies" },
          ]),
        )}
      />
      <main>
        <PageHero
          badge="Case Studies"
          title="Real Results. Measurable Impact."
          description="Discover how Fox Chase Health Care, Genesis Healthcare, and Paramount Senior Living partner with Sompacare to solve staffing challenges, reduce turnover, and maintain compliance."
          image="medicalStaff"
        />
        <CaseStudiesFullSection />
        <SuccessStoriesSection />
        <ConversionCTASection />
      </main>
    </SiteLayout>
  );
}
