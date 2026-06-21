import { MotionDiv } from "@/components/ui/Animated";
import { Container, Section, SectionHeading } from "@/components/ui/Primitives";
import { companyInfo } from "@/lib/data";

export function MissionVisionSection() {
  return (
    <Section className="bg-brand-navy">
      <Container>
        <SectionHeading
          badge="About Sompacare"
          title="Built on Purpose. Driven by Partnership."
          description="We exist to solve the workforce challenges that keep healthcare leaders up at night — so you can focus on what matters most: patient care."
          light
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <MotionDiv>
            <div className="h-full rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm sm:p-10">
              <span className="text-xs font-bold tracking-[0.15em] text-brand-green-light uppercase">
                Our Mission
              </span>
              <p className="mt-5 text-lg leading-relaxed text-white/80">{companyInfo.mission}</p>
            </div>
          </MotionDiv>
          <MotionDiv delay={0.1}>
            <div className="h-full rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm sm:p-10">
              <span className="text-xs font-bold tracking-[0.15em] text-brand-green-light uppercase">
                Our Vision
              </span>
              <p className="mt-5 text-lg leading-relaxed text-white/80">{companyInfo.vision}</p>
            </div>
          </MotionDiv>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {companyInfo.values.map((value, i) => (
            <MotionDiv key={value.title} delay={0.15 + i * 0.05}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-7 transition-all duration-300 hover:border-brand-green/30 hover:bg-white/10">
                <h3 className="text-base font-bold text-white">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{value.description}</p>
              </div>
            </MotionDiv>
          ))}
        </div>
      </Container>
    </Section>
  );
}
