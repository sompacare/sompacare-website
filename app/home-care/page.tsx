import { SiteLayout } from "@/components/layout/SiteLayout";
import { ContactSection } from "@/components/sections/ContactSection";
import { HomeCareSection } from "@/components/sections/HomeCareSection";
import { PageHero } from "@/components/ui/PageHero";
import { Container, Section, SectionHeading } from "@/components/ui/Primitives";
import { AnimatedItem, AnimatedStagger } from "@/components/ui/Animated";
import { CheckCircleIcon } from "@/components/icons";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seo";
import { homeCarePageSchema } from "@/lib/schema";

export const metadata = createMetadata({
  title: "In-Home Care Services",
  description:
    "Sompacare home care nationwide — personal support, memory care, clinical visits, palliative comfort, family respite, and care coordination for loved ones at home.",
  path: "/home-care",
  keywords: [
    "Home Care",
    "In-Home Care",
    "Nationwide Home Care",
    "Memory Care at Home",
    "Caregiver Services",
    "Respite Care",
  ],
});

const careProcess = [
  {
    step: "01",
    title: "Tell Us What You Need",
    description:
      "Call or submit a request. We ask about health conditions, daily routines, and the level of support your family is looking for.",
  },
  {
    step: "02",
    title: "Build the Care Plan",
    description:
      "A Sompacare nurse reviews medical needs and works with your family to outline services, visit times, and clinical oversight.",
  },
  {
    step: "03",
    title: "Match Your Care Team",
    description:
      "We introduce caregivers who fit the care plan — considering experience, communication style, and schedule compatibility.",
  },
  {
    step: "04",
    title: "Stay Connected",
    description:
      "Your coordinator checks in regularly, adjusts the plan as needs evolve, and keeps family members updated on progress.",
  },
];

export default function HomeCarePage() {
  return (
    <SiteLayout>
      <JsonLd data={homeCarePageSchema()} />
      <main>
        <PageHero
          badge="Sompacare Home Care"
          title="Professional Support, Right at Home"
          description="From everyday personal care to nurse-led clinical visits, Sompacare helps families nationwide keep loved ones safe, comfortable, and independent in the place they know best."
        />
        <HomeCareSection variant="full" />
        <Section className="bg-white">
          <Container>
            <SectionHeading
              badge="Our Process"
              title="How Sompacare Home Care Works"
              description="Every engagement starts with listening — then we design care around the person, not a generic checklist."
            />
            <AnimatedStagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {careProcess.map((step) => (
                <AnimatedItem key={step.step}>
                  <div className="h-full rounded-2xl border border-slate-200 bg-slate-50 p-7">
                    <span className="text-xs font-bold tracking-widest text-brand-blue uppercase">
                      Step {step.step}
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-brand-navy">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-brand-slate">{step.description}</p>
                  </div>
                </AnimatedItem>
              ))}
            </AnimatedStagger>
          </Container>
        </Section>
        <Section className="bg-brand-navy">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                One Partner for Home and Facility Care
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-white/65">
                Sompacare also staffs hospitals, nursing homes, and clinics nationwide.
                Families and facilities work with the same team they trust — 24/7 when urgency matters.
              </p>
              <ul className="mt-8 inline-grid gap-3 text-left sm:grid-cols-2">
                {[
                  "RN, LPN & CNA facility staffing",
                  "Per diem and contract coverage",
                  "HR and workforce consulting",
                  "Credentialing and compliance support",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-white/80">
                    <CheckCircleIcon className="h-4 w-4 shrink-0 text-brand-green-light" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </Section>
        <ContactSection compact />
      </main>
    </SiteLayout>
  );
}
