import { ShieldCheckIcon } from "@/components/icons";
import { AnimatedItem, AnimatedStagger } from "@/components/ui/Animated";
import { Container, OutlineButton, Section, SectionHeading } from "@/components/ui/Primitives";
import { hrSolutions } from "@/lib/data";

export function HRSolutionsSection() {
  return (
    <Section id="hr-solutions" className="bg-white">
      <Container>
        <SectionHeading
          badge="Healthcare HR Solutions"
          title="Enterprise Workforce Management Beyond Staffing"
          description="Solve recruitment challenges, strengthen compliance, and build a resilient workforce with end-to-end HR support tailored to healthcare organizations."
        />

        <AnimatedStagger className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {hrSolutions.map((solution) => (
            <AnimatedItem key={solution.title}>
              <div className="group h-full rounded-2xl border border-slate-200/80 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand-green/30 hover:shadow-lg">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green/10 transition-all duration-300 group-hover:bg-brand-green group-hover:shadow-md group-hover:shadow-brand-green/25">
                  <ShieldCheckIcon className="h-5 w-5 text-brand-green transition-colors duration-300 group-hover:text-white" />
                </div>
                <h3 className="mt-5 text-base font-bold text-brand-navy">{solution.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-slate">
                  {solution.description}
                </p>
              </div>
            </AnimatedItem>
          ))}
        </AnimatedStagger>

        <div className="mt-14 text-center">
          <OutlineButton href="/hr-solutions">Explore HR Solutions</OutlineButton>
        </div>
      </Container>
    </Section>
  );
}
