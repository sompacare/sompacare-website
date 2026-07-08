import Link from "next/link";
import { BriefcaseIcon, HeartPulseIcon } from "@/components/icons";
import { Container, OutlineButton, Section, SectionHeading } from "@/components/ui/Primitives";

const solutions = [
  {
    title: "Home Care",
    description:
      "Compassionate in-home care for families — personal care, memory support, clinical nursing visits, and care coordination nationwide.",
    href: "/home-care",
    icon: HeartPulseIcon,
    accent: "from-brand-green/10 to-brand-green/5 border-brand-green/20 hover:border-brand-green/40",
    iconBg: "bg-brand-green/10 group-hover:bg-brand-green",
    iconColor: "text-brand-green group-hover:text-white",
    cta: "Explore Home Care",
  },
  {
    title: "HR Solutions",
    description:
      "Enterprise workforce management beyond staffing — talent acquisition, compliance, onboarding, payroll support, and retention strategies.",
    href: "/hr-solutions",
    icon: BriefcaseIcon,
    accent: "from-brand-blue/10 to-brand-blue/5 border-brand-blue/20 hover:border-brand-blue/40",
    iconBg: "bg-brand-blue/10 group-hover:bg-brand-blue",
    iconColor: "text-brand-blue group-hover:text-white",
    cta: "Explore HR Solutions",
  },
];

export function SolutionsHubSection() {
  return (
    <Section id="more-solutions" className="light-surface bg-slate-50">
      <Container>
        <SectionHeading
          badge="More From Sompacare"
          title="Home Care & HR Solutions"
          description="Staffing is our core — but Sompacare also supports families at home and healthcare organizations with full workforce management."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {solutions.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className={`group flex h-full flex-col rounded-3xl border bg-gradient-to-br p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${item.accent}`}
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ${item.iconBg}`}
                >
                  <Icon className={`h-7 w-7 transition-colors duration-300 ${item.iconColor}`} />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-brand-navy">{item.title}</h3>
                <p className="mt-3 flex-1 text-base leading-relaxed text-brand-slate">
                  {item.description}
                </p>
                <span className="mt-6 text-sm font-semibold text-brand-blue transition-colors group-hover:text-brand-blue-dark">
                  {item.cta} →
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <OutlineButton href="/services">View All Services</OutlineButton>
        </div>
      </Container>
    </Section>
  );
}
