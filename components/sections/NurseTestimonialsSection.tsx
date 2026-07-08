"use client";

import { motion } from "framer-motion";
import { StarIcon } from "@/components/icons";
import { Container, Section, SectionHeading } from "@/components/ui/Primitives";
import { nurseTestimonials } from "@/lib/data";

export function NurseTestimonialsSection() {
  const doubled = [...nurseTestimonials, ...nurseTestimonials];

  return (
    <Section className="overflow-hidden bg-white">
      <Container>
        <SectionHeading
          badge="Clinician Reviews"
          title="Nurses ❤️ Sompacare"
          description="Hear from CNAs, LPNs, and RNs who pick up per diem, contract, and travel shifts through our nationwide network."
        />

        <div className="relative mt-14">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent sm:w-24" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent sm:w-24" />
          <motion.div
            className="flex w-max gap-6"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          >
            {doubled.map((t, i) => (
              <blockquote
                key={`${t.name}-${i}`}
                className="w-[340px] shrink-0 rounded-3xl border border-slate-200/80 bg-slate-50 p-7 sm:w-[380px]"
              >
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <StarIcon key={j} className="h-4 w-4 text-amber-400" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-brand-slate">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-6 border-t border-slate-200 pt-5">
                  <p className="text-sm font-bold text-brand-navy">{t.name}</p>
                  <p className="text-xs text-brand-blue">
                    {t.role} · {t.state}
                  </p>
                </footer>
              </blockquote>
            ))}
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}
