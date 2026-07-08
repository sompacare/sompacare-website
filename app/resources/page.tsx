import { SiteLayout } from "@/components/layout/SiteLayout";
import {
  RoiCareGallery,
  RoiHeroCollage,
  RoiPhotoStrip,
} from "@/components/resources/RoiPageVisuals";
import { StaffingRoiCalculator } from "@/components/resources/StaffingRoiCalculator";
import { PageHero } from "@/components/ui/PageHero";
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
        <PageHero
          badge="ROI Calculator"
          title="See how much you could save on staffing"
          description="Compare agency markup to Sompacare's platform fees — then picture those savings supporting the CNAs, LPNs, and RNs who keep your patients smiling."
          image="homeCare"
        />
        <Section className="light-surface bg-slate-50 !pb-20 !pt-12 sm:!pt-16">
          <Container>
            <RoiHeroCollage />
            <div className="lg:hidden">
              <RoiPhotoStrip />
            </div>
            <StaffingRoiCalculator />
            <RoiCareGallery />
          </Container>
        </Section>
      </main>
    </SiteLayout>
  );
}
