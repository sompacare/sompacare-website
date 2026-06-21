"use client";

import { MotionDiv } from "@/components/ui/Animated";
import { Container, PrimaryButton, SecondaryButton, Section } from "@/components/ui/Primitives";
import { siteConfig } from "@/lib/data";

export function ConversionCTASection() {
  return (
    <Section className="relative overflow-hidden bg-gradient-to-br from-brand-blue via-brand-blue-dark to-brand-navy">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-green/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      </div>
      <Container className="relative text-center">
        <MotionDiv>
          <p className="text-xs font-bold tracking-[0.2em] text-brand-green-light uppercase">
            Partner With Sompacare
          </p>
          <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Ready to Build a Stronger Healthcare Workforce?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/65">
            Join 500+ healthcare organizations that trust Sompacare for staffing,
            recruitment, and enterprise workforce solutions.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <PrimaryButton href="/contact">Request Staffing Support</PrimaryButton>
            <SecondaryButton href="/contact">Schedule Consultation</SecondaryButton>
          </div>
          <p className="mt-6 text-sm text-white/50">
            Or call{" "}
            <a href={siteConfig.phoneHref} className="font-semibold text-brand-green-light hover:underline">
              {siteConfig.phone}
            </a>
          </p>
        </MotionDiv>
      </Container>
    </Section>
  );
}
