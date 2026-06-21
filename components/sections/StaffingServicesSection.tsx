import Link from "next/link";
import {
  BriefcaseIcon,
  CheckCircleIcon,
  ClockIcon,
  GlobeIcon,
  HeartPulseIcon,
  UsersIcon,
} from "@/components/icons";
import { AnimatedItem, AnimatedStagger } from "@/components/ui/Animated";
import { Container, OutlineButton, Section, SectionHeading } from "@/components/ui/Primitives";
import { staffingServices } from "@/lib/data";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  rn: HeartPulseIcon,
  lpn: UsersIcon,
  cna: CheckCircleIcon,
  travel: GlobeIcon,
  perdiem: ClockIcon,
  permanent: BriefcaseIcon,
  recruitment: UsersIcon,
  hr: BriefcaseIcon,
};

export function StaffingServicesSection() {
  return (
    <Section id="staffing" className="bg-slate-50">
      <Container>
        <SectionHeading
          badge="Staffing Services"
          title="Dedicated Staffing Solutions for Every Clinical Role"
          description="From RNs and travel nurses to per diem coverage and permanent placement — Sompacare delivers qualified professionals when and where you need them."
        />

        <AnimatedStagger className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {staffingServices.map((service) => {
            const Icon = iconMap[service.icon] ?? UsersIcon;
            return (
              <AnimatedItem key={service.title}>
                <Link
                  href={service.href}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue/30 hover:shadow-xl"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue/10 to-brand-green/10 transition-all duration-300 group-hover:from-brand-blue group-hover:to-brand-green group-hover:shadow-lg group-hover:shadow-brand-blue/20">
                    <Icon className="h-6 w-6 text-brand-blue transition-colors duration-300 group-hover:text-white" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-brand-navy">{service.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-slate">
                    {service.description}
                  </p>
                  <span className="mt-5 text-xs font-semibold text-brand-blue transition-colors group-hover:text-brand-blue-dark">
                    Learn more →
                  </span>
                </Link>
              </AnimatedItem>
            );
          })}
        </AnimatedStagger>

        <div className="mt-14 text-center">
          <OutlineButton href="/staffing">View All Staffing Services</OutlineButton>
        </div>
      </Container>
    </Section>
  );
}
