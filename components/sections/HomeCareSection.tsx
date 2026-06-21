import Link from "next/link";
import { ApplyNowButton } from "@/components/careers/ApplyNowButton";
import { HeartPulseIcon } from "@/components/icons";
import { AnimatedItem, AnimatedStagger } from "@/components/ui/Animated";
import { Container, OutlineButton, PrimaryButton, Section, SectionHeading } from "@/components/ui/Primitives";
import { homeCareHighlights, homeCareServices } from "@/lib/data";

type HomeCareSectionProps = {
  variant?: "preview" | "full";
};

export function HomeCareSection({ variant = "preview" }: HomeCareSectionProps) {
  const isFull = variant === "full";

  return (
    <Section id="home-care" className="bg-slate-50">
      <Container>
        <SectionHeading
          badge="Sompacare Home Care"
          title="Care That Keeps People Where They Belong"
          description="Our in-home care program pairs trained caregivers and licensed nurses with families nationwide — built around each client's home, habits, and health goals."
        />

        <AnimatedStagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {homeCareServices.map((service) => (
            <AnimatedItem key={service.id}>
              <article
                id={isFull ? service.id : undefined}
                className="scroll-mt-28 group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue/30 hover:shadow-lg"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue/10 to-brand-green/10 transition-all duration-300 group-hover:from-brand-blue group-hover:to-brand-green">
                  <HeartPulseIcon className="h-5 w-5 text-brand-blue transition-colors duration-300 group-hover:text-white" />
                </div>
                <h3 className="mt-5 text-base font-bold text-brand-navy">{service.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-brand-slate">
                  {service.description}
                </p>
              </article>
            </AnimatedItem>
          ))}
        </AnimatedStagger>

        {isFull && (
          <AnimatedStagger className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {homeCareHighlights.map((item) => (
              <AnimatedItem key={item}>
                <div className="rounded-xl border border-brand-blue/10 bg-brand-blue/5 px-5 py-4 text-sm font-medium text-brand-navy">
                  {item}
                </div>
              </AnimatedItem>
            ))}
          </AnimatedStagger>
        )}

        <div className="mt-14 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {!isFull ? (
            <>
              <PrimaryButton href="/home-care">View Home Care Services</PrimaryButton>
              <OutlineButton href="/contact">Talk With a Care Advisor</OutlineButton>
            </>
          ) : (
            <>
              <PrimaryButton href="/contact">Request a Care Assessment</PrimaryButton>
              <ApplyNowButton
                positionId="cna"
                className="inline-flex items-center justify-center gap-2.5 rounded-full border-2 border-brand-blue/20 bg-white px-8 py-4 text-sm font-semibold text-brand-blue transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-blue hover:bg-brand-blue/5"
              >
                Apply as a Caregiver
              </ApplyNowButton>
            </>
          )}
        </div>

        {!isFull && (
          <p className="mt-6 text-center text-sm text-brand-slate">
            Looking for facility staffing instead?{" "}
            <Link href="/staffing" className="font-semibold text-brand-blue hover:underline">
              Explore our clinical staffing services
            </Link>
          </p>
        )}
      </Container>
    </Section>
  );
}
