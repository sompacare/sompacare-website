"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@/components/icons";
import { HealthcareImage } from "@/components/ui/HealthcareImage";
import { Container, PrimaryButton, Section, SectionHeading } from "@/components/ui/Primitives";
import { caseStudies } from "@/lib/data";
import type { HealthcareImageKey } from "@/lib/healthcare-images";

export function CaseStudiesSection({ limit }: { limit?: number }) {
  const items = limit ? caseStudies.slice(0, limit) : caseStudies;

  return (
    <Section className="bg-surface">
      <Container>
        <SectionHeading
          badge="Case Studies"
          title="Proven Results for Healthcare Organizations"
          description="See how Sompacare delivers measurable staffing outcomes for Fox Chase Health Care, Genesis Healthcare, Paramount Senior Living, and facilities nationwide."
        />

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {items.map((study, i) => (
            <motion.article
              key={study.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="card-hover group flex flex-col overflow-hidden rounded-3xl border border-border bg-surface-elevated shadow-sm transition-shadow duration-300 hover:shadow-xl"
            >
              <HealthcareImage
                image={study.image as HealthcareImageKey}
                className="h-44 w-full"
                animate={false}
              />
              <div className="h-1" style={{ backgroundColor: study.color }} />
              <div className="flex flex-1 flex-col p-8">
                <span className="text-[10px] font-bold tracking-[0.15em] text-brand-blue uppercase">
                  {study.industry}
                </span>
                <h3 className="mt-3 text-lg font-bold text-foreground transition-colors group-hover:text-brand-blue">
                  {study.title}
                </h3>
                <p className="mt-1 text-sm font-semibold text-brand-green">{study.client}</p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">{study.challenge}</p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {study.results.slice(0, 4).map((r, j) => (
                    <motion.div
                      key={r.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + j * 0.05 }}
                      className="rounded-xl bg-surface p-3 text-center"
                    >
                      <p className="text-lg font-bold text-brand-blue">{r.metric}</p>
                      <p className="mt-0.5 text-[10px] font-medium text-muted">{r.label}</p>
                    </motion.div>
                  ))}
                </div>

                <blockquote className="mt-6 border-l-2 border-brand-green pl-4 text-sm italic text-muted">
                  &ldquo;{study.quote}&rdquo;
                  <footer className="mt-2 text-xs font-semibold not-italic text-foreground">
                    — {study.author}, {study.role}
                  </footer>
                </blockquote>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <PrimaryButton href="/case-studies">View All Case Studies</PrimaryButton>
        </motion.div>
      </Container>
    </Section>
  );
}

export function CaseStudiesFullSection() {
  return (
    <Section className="bg-background">
      <Container>
        <div className="space-y-16">
          {caseStudies.map((study, i) => (
            <motion.article
              key={study.id}
              id={study.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className="scroll-mt-28 overflow-hidden rounded-3xl border border-border bg-surface-elevated shadow-sm"
            >
              <div className="grid lg:grid-cols-2">
                <div className="relative min-h-[240px] lg:min-h-full">
                  <HealthcareImage
                    image={study.image as HealthcareImageKey}
                    className="absolute inset-0 h-full w-full"
                  />
                </div>

                <div className="p-8 sm:p-10 lg:p-12">
                  <span className="text-xs font-bold tracking-[0.15em] text-brand-blue uppercase">
                    {study.industry}
                  </span>
                  <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">{study.title}</h2>
                  <p className="mt-2 text-base font-semibold text-brand-green">{study.client}</p>

                  <div className="mt-8 space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Challenge</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{study.challenge}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Solution</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{study.solution}</p>
                    </div>
                  </div>

                  <blockquote className="mt-8 rounded-2xl border border-border bg-surface p-6">
                    <p className="text-sm italic text-muted">&ldquo;{study.quote}&rdquo;</p>
                    <footer className="mt-3 text-sm font-semibold text-foreground">
                      {study.author}, {study.role}
                    </footer>
                  </blockquote>
                </div>
              </div>

              <div
                className="border-t border-border px-8 py-8 sm:px-10 sm:py-10 lg:px-12"
                style={{ backgroundColor: `${study.color}08` }}
              >
                <h3 className="text-sm font-bold tracking-wide text-foreground uppercase">Key Results</h3>
                <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {study.results.map((r, j) => (
                    <motion.div
                      key={r.label}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: j * 0.08 }}
                      className="rounded-2xl border border-border bg-surface-elevated p-5 text-center"
                    >
                      <p className="text-2xl font-bold sm:text-3xl" style={{ color: study.color }}>
                        {r.metric}
                      </p>
                      <p className="mt-1 text-xs font-medium text-muted">{r.label}</p>
                    </motion.div>
                  ))}
                </div>
                <Link
                  href="/contact"
                  className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-blue transition-colors hover:text-brand-blue-dark"
                >
                  Get Similar Results
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </Container>
    </Section>
  );
}
