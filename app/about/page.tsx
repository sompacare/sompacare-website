import { SiteLayout } from "@/components/layout/SiteLayout";
import {
  AboutCTASection,
  AboutStatsBar,
  CompanyStorySection,
} from "@/components/sections/AboutPageSections";
import { MissionVisionSection } from "@/components/sections/MissionVisionSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { IndustriesSection, WhyChooseSection } from "@/components/sections/WhyChooseSection";
import { PageHero } from "@/components/ui/PageHero";
import { AnimatedItem, AnimatedStagger } from "@/components/ui/Animated";
import { Container, Section, SectionHeading } from "@/components/ui/Primitives";
import { JsonLd } from "@/components/seo/JsonLd";
import { leadership } from "@/lib/data";
import { createMetadata } from "@/lib/seo";
import { aboutPageSchema } from "@/lib/schema";

export const metadata = createMetadata({
  title: "About Our Medical Staffing Agency",
  description:
    "Learn about Sompacare, a trusted medical staffing agency and healthcare workforce solutions partner delivering healthcare staffing and healthcare recruitment nationwide.",
  path: "/about",
  keywords: [
    "Medical Staffing Agency",
    "Healthcare Staffing",
    "Healthcare Workforce Solutions",
    "Nurse Staffing Agency",
    "Healthcare Recruitment",
  ],
});

export default function AboutPage() {
  return (
    <SiteLayout>
      <JsonLd data={aboutPageSchema()} />
      <main>
        <PageHero
          badge="About Sompacare"
          title="Transforming Healthcare Workforce Management Nationwide"
          description="Sompacare is a healthcare staffing and workforce solutions company dedicated to helping hospitals, nursing homes, and healthcare organizations build exceptional clinical teams."
        />
        <AboutStatsBar />
        <CompanyStorySection />
        <MissionVisionSection />
        <Section className="bg-slate-50">
          <Container>
            <SectionHeading
              badge="Leadership"
              title="Experienced Leaders. Healthcare Focused."
              description="Our executive team brings decades of combined experience in healthcare staffing, clinical operations, and workforce management."
            />
            <AnimatedStagger className="mt-16 grid gap-8 md:grid-cols-3">
              {leadership.map((leader) => (
                <AnimatedItem key={leader.name}>
                  <div className="h-full rounded-3xl border border-slate-200/80 bg-white p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div
                      className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-lg font-bold text-white shadow-lg"
                      style={{ backgroundColor: leader.color }}
                    >
                      {leader.initials}
                    </div>
                    <h3 className="mt-6 text-lg font-bold text-brand-navy">{leader.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-brand-blue">{leader.role}</p>
                    <p className="mt-3 text-sm leading-relaxed text-brand-slate">{leader.bio}</p>
                  </div>
                </AnimatedItem>
              ))}
            </AnimatedStagger>
          </Container>
        </Section>
        <IndustriesSection />
        <WhyChooseSection />
        <TestimonialsSection limit={3} />
        <AboutCTASection />
      </main>
    </SiteLayout>
  );
}
