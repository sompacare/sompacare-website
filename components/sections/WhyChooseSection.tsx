import {
  BuildingIcon,
  CheckCircleIcon,
  ClockIcon,
  HeartPulseIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@/components/icons";
import { AnimatedItem, AnimatedStagger } from "@/components/ui/Animated";
import { Container, Section, SectionHeading } from "@/components/ui/Primitives";
import { industries, whyChoose } from "@/lib/data";

const whyIcons = [ClockIcon, CheckCircleIcon, ShieldCheckIcon, UsersIcon, BuildingIcon, HeartPulseIcon];

export function WhyChooseSection() {
  return (
    <Section className="bg-surface">
      <Container>
        <SectionHeading
          badge="Why Sompacare"
          title="The Workforce Partner Healthcare Leaders Rely On"
          description="We combine clinical staffing expertise with enterprise HR capabilities to deliver safe staffing, compliant operations, and exceptional patient care outcomes."
        />

        <AnimatedStagger className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {whyChoose.map((item, i) => {
            const Icon = whyIcons[i] ?? ShieldCheckIcon;
            return (
              <AnimatedItem key={item.title}>
                <div className="group h-full rounded-2xl border border-border bg-surface-elevated p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue/25 hover:shadow-lg">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue/10 transition-all duration-300 group-hover:bg-brand-blue group-hover:shadow-md group-hover:shadow-brand-blue/20">
                    <Icon className="h-6 w-6 text-brand-blue transition-colors duration-300 group-hover:text-white" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
                </div>
              </AnimatedItem>
            );
          })}
        </AnimatedStagger>
      </Container>
    </Section>
  );
}

export function IndustriesSection() {
  return (
    <Section className="bg-background">
      <Container>
        <SectionHeading
          badge="Industries We Serve"
          title="Partnering With Healthcare Organizations Nationwide"
          description="We understand the unique staffing and workforce demands of every care environment we serve."
        />

        <AnimatedStagger className="mt-14 flex flex-wrap justify-center gap-3">
          {industries.map((industry) => (
            <AnimatedItem key={industry}>
              <span className="inline-flex items-center rounded-full border border-border bg-surface-elevated px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-green/30 hover:shadow-md">
                {industry}
              </span>
            </AnimatedItem>
          ))}
        </AnimatedStagger>
      </Container>
    </Section>
  );
}
