import { SiteLayout } from "@/components/layout/SiteLayout";
import { ContactSection } from "@/components/sections/ContactSection";
import { PageHero } from "@/components/ui/PageHero";
import { Container, OutlineButton, PrimaryButton, Section, SectionHeading } from "@/components/ui/Primitives";
import { MotionDiv } from "@/components/ui/Animated";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seo";
import { staffingPageSchema } from "@/lib/schema";

export const metadata = createMetadata({
  title: "Nurse Staffing Agency & Healthcare Staffing",
  description:
    "Sompacare is a nurse staffing agency providing RN, LPN, CNA, travel nurse, per diem, and permanent healthcare staffing for hospitals and care facilities nationwide.",
  path: "/staffing",
  keywords: [
    "Nurse Staffing Agency",
    "Healthcare Staffing",
    "Medical Staffing Agency",
    "RN Staffing",
    "Travel Nurses",
    "Per Diem Staffing",
  ],
});

const staffingDetails = [
  {
    id: "rn",
    title: "RN Staffing",
    description:
      "Experienced Registered Nurses for acute care, critical care, emergency departments, and specialty units. Our RNs are credentialed, clinically competent, and ready to deliver exceptional patient care from day one.",
    highlights: ["ICU & Critical Care", "Emergency Department", "Medical-Surgical", "Specialty Units"],
  },
  {
    id: "lpn",
    title: "LPN Staffing",
    description:
      "Licensed Practical Nurses for skilled nursing facilities, long-term care, rehabilitation centers, and outpatient clinics. Flexible coverage for every shift and census level.",
    highlights: ["Skilled Nursing", "Long-Term Care", "Rehabilitation", "Outpatient Clinics"],
  },
  {
    id: "cna",
    title: "CNA Staffing",
    description:
      "Certified Nursing Assistants providing essential patient care, daily living support, and compassionate bedside assistance. Reliable coverage for your direct care needs.",
    highlights: ["Patient Care", "Activities of Daily Living", "Vital Signs", "Mobility Support"],
  },
  {
    id: "travel",
    title: "Travel Nurses",
    description:
      "Nationwide travel nurse placements for surge capacity, seasonal demand, and specialty assignments. Fully credentialed professionals deployed to your facility with complete onboarding support.",
    highlights: ["13-Week Assignments", "Nationwide Coverage", "Specialty Placements", "Housing Coordination"],
  },
  {
    id: "per-diem",
    title: "Per Diem Staffing",
    description:
      "Flexible per diem professionals to fill shifts, manage census fluctuations, and cover unexpected absences. Scale your workforce up or down without long-term commitments.",
    highlights: ["Shift-by-Shift Coverage", "No Long-Term Contracts", "Rapid Deployment", "Cost-Effective"],
  },
  {
    id: "permanent",
    title: "Permanent Placement",
    description:
      "Direct hire solutions for leadership roles, specialty positions, and hard-to-fill clinical openings. We source, screen, and place top talent for your long-term workforce needs.",
    highlights: ["Direct Hire", "Leadership Roles", "Specialty Positions", "Retention Focus"],
  },
];

export default function StaffingPage() {
  return (
    <SiteLayout>
      <JsonLd data={staffingPageSchema()} />
      <main>
        <PageHero
          badge="Healthcare Staffing"
          title="Qualified Clinical Professionals, Delivered Fast"
          description="Sompacare provides RNs, LPNs, CNAs, travel nurses, and allied health professionals through flexible staffing models designed for healthcare urgency."
        />
        <Section className="bg-white">
          <Container>
            <div className="space-y-20">
              {staffingDetails.map((service, index) => (
                <MotionDiv key={service.id}>
                  <div
                    id={service.id}
                    className="scroll-mt-28 grid gap-10 lg:grid-cols-2 lg:items-center"
                  >
                    <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                      <span className="text-xs font-bold tracking-[0.15em] text-brand-blue uppercase">
                        Staffing Service
                      </span>
                      <h2 className="mt-3 text-2xl font-bold text-brand-navy sm:text-3xl">
                        {service.title}
                      </h2>
                      <p className="mt-4 text-base leading-relaxed text-brand-slate">
                        {service.description}
                      </p>
                      <div className="mt-8">
                        <PrimaryButton href="/contact">Request {service.title.split(" ")[0]} Staff</PrimaryButton>
                      </div>
                    </div>
                    <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
                        <h3 className="text-sm font-bold tracking-wide text-brand-navy uppercase">
                          Coverage Areas
                        </h3>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          {service.highlights.map((h) => (
                            <div
                              key={h}
                              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-brand-navy"
                            >
                              {h}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </MotionDiv>
              ))}
            </div>
          </Container>
        </Section>
        <Section className="bg-slate-50">
          <Container className="text-center">
            <SectionHeading
              badge="Get Started"
              title="Ready to Fill Your Staffing Gaps?"
              description="Tell us about your clinical staffing needs and we'll deliver qualified, credentialed professionals fast."
            />
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <PrimaryButton href="/contact">Request Staff</PrimaryButton>
              <OutlineButton href="/contact">Schedule Consultation</OutlineButton>
            </div>
          </Container>
        </Section>
        <ContactSection compact />
      </main>
    </SiteLayout>
  );
}
