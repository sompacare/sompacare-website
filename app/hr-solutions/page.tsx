import { SiteLayout } from "@/components/layout/SiteLayout";
import { ContactSection } from "@/components/sections/ContactSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { PageHero } from "@/components/ui/PageHero";
import { Container, OutlineButton, PrimaryButton, Section, SectionHeading } from "@/components/ui/Primitives";
import { AnimatedItem, AnimatedStagger } from "@/components/ui/Animated";
import { hrSolutions } from "@/lib/data";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seo";
import { hrSolutionsPageSchema } from "@/lib/schema";

export const metadata = createMetadata({
  title: "Healthcare Workforce Solutions",
  description:
    "Enterprise healthcare workforce solutions from Sompacare — talent acquisition, workforce planning, credential verification, compliance, onboarding, and retention for healthcare organizations.",
  path: "/hr-solutions",
  keywords: [
    "Healthcare Workforce Solutions",
    "Healthcare Staffing",
    "Medical Staffing Agency",
    "Healthcare Recruitment",
    "Healthcare HR",
  ],
});

const solutionDetails: Record<string, string> = {
  "Talent Acquisition": "Build high-performing hiring pipelines with targeted sourcing, employer branding, and candidate experience optimization designed for healthcare roles.",
  "Workforce Planning": "Leverage predictive analytics and census modeling to align staffing levels with patient demand, budget constraints, and quality outcomes.",
  "Credential Verification": "Automated and manual verification of licenses, certifications, immunizations, and background checks for audit-ready compliance.",
  "Compliance Management": "Continuous monitoring of regulatory requirements, documentation audits, and policy alignment across all facilities and departments.",
  "Employee Onboarding": "Structured orientation programs, competency assessments, and integration support that accelerate time-to-productivity for every new hire.",
  "Payroll Support": "Coordinated payroll management for contract, per diem, and temporary staff with accurate time tracking and reporting.",
  "Retention Strategies": "Data-driven engagement programs, career development pathways, and culture initiatives that reduce turnover and strengthen teams.",
};

export default function HRSolutionsPage() {
  return (
    <SiteLayout>
      <JsonLd data={hrSolutionsPageSchema()} />
      <main>
        <PageHero
          badge="HR & Workforce Solutions"
          title="Enterprise Workforce Management for Healthcare"
          description="Beyond staffing — Sompacare delivers the HR infrastructure, compliance systems, and workforce strategies that power sustainable healthcare operations."
        />
        <Section className="bg-white">
          <Container>
            <SectionHeading
              badge="Our Solutions"
              title="End-to-End Healthcare HR Support"
              description="Every solution is designed specifically for the complexities of healthcare workforce management."
            />
            <AnimatedStagger className="mt-16 space-y-8">
              {hrSolutions.map((solution) => (
                <AnimatedItem key={solution.title}>
                  <div
                    id={
                      solution.title === "Compliance Management"
                        ? "compliance"
                        : solution.title.toLowerCase().replace(/\s+/g, "-")
                    }
                    className="scroll-mt-28 rounded-3xl border border-slate-200/80 bg-slate-50 p-8 transition-all duration-300 hover:shadow-lg sm:p-10"
                  >
                    <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
                      <div className="lg:col-span-1">
                        <h2 className="text-xl font-bold text-brand-navy sm:text-2xl">
                          {solution.title}
                        </h2>
                      </div>
                      <div className="lg:col-span-2">
                        <p className="text-base leading-relaxed text-brand-slate">
                          {solutionDetails[solution.title] ?? solution.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </AnimatedItem>
              ))}
            </AnimatedStagger>
          </Container>
        </Section>
        <HowItWorksSection />
        <Section className="bg-slate-50">
          <Container className="text-center">
            <SectionHeading
              badge="Partner With Us"
              title="Transform Your Workforce Operations"
              description="Schedule a consultation with our HR solutions team to design a customized workforce strategy for your organization."
            />
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <PrimaryButton href="/contact">Schedule Consultation</PrimaryButton>
              <OutlineButton href="/contact">Contact Our Team</OutlineButton>
            </div>
          </Container>
        </Section>
        <ContactSection compact />
      </main>
    </SiteLayout>
  );
}
