import { CheckCircleIcon } from "@/components/icons";
import { MotionDiv } from "@/components/ui/Animated";
import { HealthcareImage } from "@/components/ui/HealthcareImage";
import {
  Container,
  PrimaryButton,
  Section,
  SectionHeading,
} from "@/components/ui/Primitives";
import { aboutStory, heroStats, siteConfig } from "@/lib/data";

export function AboutStatsBar() {
  return (
    <Section className="border-y border-white/10 bg-brand-navy py-12 sm:py-14">
      <Container>
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {heroStats.map((stat, i) => (
            <MotionDiv key={stat.label} delay={i * 0.05}>
              <div className="text-center">
                <p className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm font-medium text-white/60">{stat.label}</p>
              </div>
            </MotionDiv>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function CompanyStorySection() {
  return (
    <Section className="bg-white">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
          <MotionDiv>
            <HealthcareImage image="medicalStaff" className="h-72 rounded-3xl shadow-xl sm:h-96" />
          </MotionDiv>

          <div>
            <SectionHeading
              badge="Our Story"
              title="Built By Healthcare Leaders, For Healthcare Leaders"
              description="We understand the pressure of census spikes, regulatory audits, and the human cost of every unfilled shift — because we've lived it."
              align="left"
            />
            <div className="mt-8 space-y-5">
              {aboutStory.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="text-base leading-relaxed text-brand-slate">
                  {paragraph}
                </p>
              ))}
            </div>

            <MotionDiv className="mt-10">
              <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-8 sm:p-10">
                <h3 className="text-lg font-bold text-brand-navy">What Sets Us Apart</h3>
                <ul className="mt-6 space-y-4">
                  {aboutStory.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-3">
                      <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
                      <span className="text-sm leading-relaxed text-brand-slate">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </MotionDiv>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export function AboutCTASection() {
  return (
    <Section className="relative overflow-hidden bg-gradient-to-br from-brand-blue via-brand-blue-dark to-brand-navy">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-green/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      </div>
      <Container className="relative text-center">
        <SectionHeading
          badge="Partner With Us"
          title="Ready to Strengthen Your Healthcare Workforce?"
          description="Whether you need urgent shift coverage, travel nurses, or a long-term workforce strategy — our team is ready to help."
          light
        />
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <PrimaryButton href="/contact">Request Staffing Support</PrimaryButton>
          <a
            href={siteConfig.phoneHref}
            className="inline-flex items-center justify-center rounded-full border-2 border-white/30 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/10"
          >
            Call {siteConfig.phone}
          </a>
        </div>
        <p className="mt-6 text-sm text-white/55">
          Or email us at{" "}
          <a href={`mailto:${siteConfig.email}`} className="font-semibold text-brand-green-light hover:underline">
            {siteConfig.email}
          </a>
        </p>
      </Container>
    </Section>
  );
}
