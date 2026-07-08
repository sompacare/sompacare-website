import Link from "next/link";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ContactSection } from "@/components/sections/ContactSection";
import { HomeCareSection } from "@/components/sections/HomeCareSection";
import { HRSolutionsSection } from "@/components/sections/HRSolutionsSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { StaffingServicesSection } from "@/components/sections/StaffingServicesSection";
import { PageHero } from "@/components/ui/PageHero";
import { Container, Section, SectionHeading } from "@/components/ui/Primitives";
import { AnimatedItem, AnimatedStagger } from "@/components/ui/Animated";
import { industries } from "@/lib/data";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seo";
import { servicesPageSchema } from "@/lib/schema";

export const metadata = createMetadata({
  title: "Medical Staffing Agency Services Nationwide",
  description:
    "Explore Sompacare medical staffing agency services — healthcare staffing, nurse staffing, travel nurses, per diem nursing, permanent placement, in-home care, and healthcare workforce solutions nationwide.",
  path: "/services",
  keywords: [
    "Medical Staffing Agency",
    "Healthcare Staffing",
    "Healthcare Recruitment",
    "Healthcare Workforce Solutions",
    "Nurse Staffing Agency",
  ],
});

export default function ServicesPage() {
  return (
    <SiteLayout>
      <JsonLd data={servicesPageSchema()} />
      <main>
        <PageHero
          badge="Our Services"
          title="Healthcare Staffing, Home Care & HR Solutions"
          description="From compassionate in-home care for families to clinical staffing and enterprise HR consulting — Sompacare delivers the talent and care your organization needs."
        />
        <HomeCareSection variant="full" />
        <StaffingServicesSection />
        <HRSolutionsSection />
        <Section className="bg-slate-50">
          <Container>
            <SectionHeading
              badge="Industries"
              title="Serving Every Healthcare Setting"
              description="Our solutions are tailored to the unique demands of diverse healthcare environments."
            />
            <AnimatedStagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {industries.map((industry) => (
                <AnimatedItem key={industry}>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center font-semibold text-brand-navy shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    {industry}
                  </div>
                </AnimatedItem>
              ))}
            </AnimatedStagger>
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <Link
                href="/home-care"
                className="rounded-full border-2 border-brand-blue/20 px-8 py-4 text-sm font-semibold text-brand-blue transition-all hover:-translate-y-0.5 hover:border-brand-blue"
              >
                View Home Care
              </Link>
              <Link
                href="/staffing"
                className="rounded-full bg-brand-blue px-8 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-brand-blue-dark"
              >
                View Staffing Services
              </Link>
              <Link
                href="/hr-solutions"
                className="rounded-full border-2 border-brand-blue/20 px-8 py-4 text-sm font-semibold text-brand-blue transition-all hover:-translate-y-0.5 hover:border-brand-blue"
              >
                View HR Solutions
              </Link>
            </div>
          </Container>
        </Section>
        <HowItWorksSection />
        <ContactSection compact />
      </main>
    </SiteLayout>
  );
}
