import { SiteLayout } from "@/components/layout/SiteLayout";
import { ContactSection } from "@/components/sections/ContactSection";
import { RequestStaffForm } from "@/components/sections/RequestStaffForm";
import { FAQSection } from "@/components/sections/FAQSection";
import { PageHero } from "@/components/ui/PageHero";
import { Container, Section } from "@/components/ui/Primitives";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seo";
import { contactPageSchema } from "@/lib/schema";

export const metadata = createMetadata({
  title: "Contact Our Healthcare Staffing Team",
  description:
    "Contact Sompacare for healthcare staffing, nurse staffing agency support, healthcare recruitment, and healthcare workforce solutions. Call (240) 676-1208 or submit our contact form.",
  path: "/contact",
  keywords: [
    "Healthcare Staffing",
    "Nurse Staffing Agency",
    "Medical Staffing Agency",
    "Healthcare Recruitment",
    "Healthcare Workforce Solutions",
  ],
});

export default function ContactPage() {
  return (
    <SiteLayout>
      <JsonLd data={contactPageSchema()} />
      <main>
        <PageHero
          badge="Contact"
          title="Let's Build Your Healthcare Workforce Together"
          description="Request staff, schedule a consultation, or reach out to our team. We're available 24/7 for urgent staffing needs."
        />

        <Section id="request-staff" className="scroll-mt-28 bg-slate-50">
          <Container>
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex rounded-full bg-brand-blue/10 px-4 py-1.5 text-[11px] font-bold tracking-wide text-brand-blue uppercase">
                For Employers
              </span>
              <h2 className="mt-4 text-3xl font-bold text-brand-navy">Request Staff</h2>
              <p className="mt-3 text-brand-slate">
                Submit a staffing request for CNAs, GNAs, CMAs, Med Techs, LPNs, RNs, and more.
                Our team responds 24/7 for urgent coverage.
              </p>
              <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <RequestStaffForm />
              </div>
            </div>
          </Container>
        </Section>

        <ContactSection />
        <FAQSection />
      </main>
    </SiteLayout>
  );
}
