import { Suspense } from "react";
import { ApplyNowButton } from "@/components/careers/ApplyNowButton";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { CareerApplicationSection } from "@/components/sections/CareerApplicationSection";
import { AnimatedItem, AnimatedStagger } from "@/components/ui/Animated";
import { PageHero } from "@/components/ui/PageHero";
import { Container, Section, SectionHeading } from "@/components/ui/Primitives";
import { ArrowRightIcon, BriefcaseIcon, CheckCircleIcon } from "@/components/icons";
import { careerBenefits } from "@/lib/data";
import { getPublishedJobPostings } from "@/lib/job-postings";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seo";
import { careersPageSchema } from "@/lib/schema";

export const metadata = createMetadata({
  title: "Healthcare Careers Portal",
  description:
    "Join Sompacare's healthcare recruitment network. Apply for RN, LPN, CNA, Medical Assistant, and Healthcare Recruiter roles with competitive pay and flexible assignments.",
  path: "/careers",
  keywords: [
    "Healthcare Recruitment",
    "Healthcare Staffing",
    "Nurse Staffing Agency",
    "Medical Staffing Agency",
    "Healthcare Careers",
  ],
});

export default async function CareersPage() {
  const careerPositions = await getPublishedJobPostings();

  return (
    <SiteLayout>
      <JsonLd data={careersPageSchema(careerPositions)} />
      <main>
        <PageHero
          badge="Find Shifts"
          title="Pick Up Per Diem, Contract & Travel Shifts Nationwide"
          description="Apply as a CNA, LPN, or RN and get matched to shifts at hospitals, skilled nursing, and senior living facilities — with competitive pay and 24/7 coordinator support."
        />

        <Section className="bg-white">
          <Container>
            <SectionHeading
              badge="Why Sompacare"
              title="A Workplace Built for Healthcare Professionals"
              description="Whether you are advancing a clinical career or growing in healthcare recruitment, Sompacare offers the support, flexibility, and opportunities you need."
            />
            <AnimatedStagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {careerBenefits.map((benefit) => (
                <AnimatedItem key={benefit.title}>
                  <div className="h-full rounded-2xl border border-slate-200/80 bg-slate-50 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10">
                      <CheckCircleIcon className="h-5 w-5 text-brand-blue" />
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-brand-navy">{benefit.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-brand-slate">
                      {benefit.description}
                    </p>
                  </div>
                </AnimatedItem>
              ))}
            </AnimatedStagger>
          </Container>
        </Section>

        <Section id="positions" className="bg-slate-50">
          <Container>
            <SectionHeading
              badge="Open Positions"
              title="Current Opportunities"
              description="Explore open clinical roles and apply online. Upload your resume and certification documents — our team responds within 2–3 business days."
            />

            <AnimatedStagger className="mt-14 space-y-6">
              {careerPositions.map((role) => (
                <AnimatedItem key={role.id}>
                  <article
                    id={role.id}
                    className="scroll-mt-28 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-lg sm:p-10"
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-[11px] font-bold tracking-wide text-brand-blue uppercase">
                            {role.category}
                          </span>
                          <span className="text-xs font-medium text-brand-slate">
                            {role.employment}
                          </span>
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-brand-navy">{role.title}</h2>
                        <p className="mt-1 text-sm font-medium text-brand-green">
                          {role.locations}
                        </p>
                        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-brand-slate">
                          {role.description}
                        </p>
                        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                          {role.requirements.map((req) => (
                            <li
                              key={req}
                              className="flex items-start gap-2 text-sm text-brand-slate"
                            >
                              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="shrink-0 lg:pt-2">
                        <ApplyNowButton
                          positionId={role.id}
                          className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-brand-blue px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-brand-blue/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-blue-dark hover:shadow-xl lg:w-auto"
                        >
                          Apply Now
                          <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </ApplyNowButton>
                      </div>
                    </div>
                  </article>
                </AnimatedItem>
              ))}
            </AnimatedStagger>
          </Container>
        </Section>

        <Section id="apply" className="scroll-mt-28 bg-brand-navy">
          <Container>
            <div className="sr-only" aria-hidden="true">
              {careerPositions.map((role) => (
                <span key={role.id} id={`apply-${role.id}`} />
              ))}
            </div>
            <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
              <div>
                <span className="inline-flex items-center rounded-full border border-brand-green/25 bg-brand-green/10 px-4 py-1.5 text-[11px] font-bold tracking-[0.12em] text-brand-green-light uppercase">
                  Apply Now
                </span>
                <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Start Your Application
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-white/65">
                  Complete the form below and our talent acquisition team will review your
                  qualifications. We respond to all applications within 2–3 business days.
                </p>
                <div className="mt-8 flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-green/20">
                    <BriefcaseIcon className="h-5 w-5 text-brand-green-light" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Equal Opportunity Employer</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/55">
                      Sompacare is committed to diversity and inclusion. We welcome applications
                      from all qualified candidates regardless of race, gender, age, religion,
                      or background.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white p-8 shadow-2xl sm:p-10">
                <h3 className="text-xl font-bold text-brand-navy">Application Form</h3>
                <p className="mt-2 text-sm text-brand-slate">
                  All fields marked required must be completed to submit your application.
                </p>
                <div className="mt-8">
                  <Suspense fallback={<p className="text-sm text-brand-slate">Loading application form…</p>}>
                    <CareerApplicationSection />
                  </Suspense>
                </div>
              </div>
            </div>
          </Container>
        </Section>
      </main>
    </SiteLayout>
  );
}
