import Link from "next/link";
import { ClockIcon } from "@/components/icons";
import { Container, PrimaryButton, Section } from "@/components/ui/Primitives";

export function FastPaySection() {
  return (
    <Section className="!py-16 sm:!py-20">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue via-brand-blue-dark to-brand-navy px-8 py-12 sm:px-12 sm:py-14 lg:flex lg:items-center lg:justify-between lg:gap-12">
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-brand-green/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <ClockIcon className="h-6 w-6 text-brand-green-light" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-white sm:text-3xl">
              Work your shift, get paid on schedule
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/70">
              Sompacare clinicians receive weekly direct deposit with transparent pay rates.
              Our payroll team handles timesheets, deductions, and payment questions so you
              can focus on patient care.
            </p>
          </div>
          <div className="relative mt-8 flex shrink-0 flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col">
            <PrimaryButton href="/careers" className="!shadow-none">
              Find Shifts
            </PrimaryButton>
            <Link
              href="/contact#request-staff"
              className="inline-flex items-center justify-center rounded-full border-2 border-white/30 px-8 py-4 text-sm font-semibold text-white transition-all hover:border-white/50 hover:bg-white/10"
            >
              Request Staff for Your Facility
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
