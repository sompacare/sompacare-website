import { SiteLayout } from "@/components/layout/SiteLayout";
import { StaffingRoiCalculator } from "@/components/resources/StaffingRoiCalculator";
import { Container, Section } from "@/components/ui/Primitives";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seo";
import { breadcrumbSchema, pageGraph, webPageSchema } from "@/lib/schema";

export const metadata = createMetadata({
  title: "Healthcare Staffing ROI Calculator",
  description:
    "Calculate your potential monthly and annual savings with Sompacare's free staffing ROI calculator. Compare agency markup vs. platform fees for CNAs, LPNs, and RNs.",
  path: "/resources",
  keywords: [
    "Healthcare Staffing ROI Calculator",
    "Nursing Home Staffing Costs",
    "Agency Markup Calculator",
    "Healthcare Staffing",
  ],
});

export default function ResourcesPage() {
  return (
    <SiteLayout>
      <JsonLd
        data={pageGraph(
          webPageSchema({
            path: "/resources",
            name: "Sompacare ROI Calculator",
            description:
              "Free interactive ROI calculator for nursing homes and healthcare facilities.",
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "ROI Calculator", path: "/resources" },
          ]),
        )}
      />
      <main>
        <Section className="light-surface bg-slate-50 !pb-20 !pt-28 sm:!pt-32">
          <Container>
            <StaffingRoiCalculator />
          </Container>
        </Section>
      </main>
    </SiteLayout>
  );
}
