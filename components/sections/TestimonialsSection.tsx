"use client";

import { motion } from "framer-motion";
import { StarIcon } from "@/components/icons";
import { Container, Section, SectionHeading } from "@/components/ui/Primitives";
import { testimonials } from "@/lib/data";

function Avatar({ initials, color, name }: { initials: string; color: string; name: string }) {
  return (
    <div
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg"
      style={{ backgroundColor: color }}
      role="img"
      aria-label={`Photo of ${name}`}
    >
      {initials}
    </div>
  );
}

export function TestimonialsSection({ limit }: { limit?: number }) {
  const items = limit ? testimonials.slice(0, limit) : testimonials;

  return (
    <Section className="bg-white">
      <Container>
        <SectionHeading
          badge="Testimonials"
          title="Trusted By Healthcare Leaders Nationwide"
          description="Hear from the organizations that rely on Sompacare for staffing excellence and workforce transformation."
        />

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {items.map((t, i) => (
            <motion.blockquote
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col rounded-3xl border border-slate-200/80 bg-slate-50 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <StarIcon key={j} className="h-4 w-4 text-amber-400" />
                ))}
              </div>
              <p className="mt-5 flex-1 text-sm leading-relaxed text-brand-slate">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="mt-8 flex items-center gap-4 border-t border-slate-200 pt-6">
                <Avatar initials={t.initials} color={t.color} name={t.name} />
                <div>
                  <p className="text-sm font-bold text-brand-navy">{t.name}</p>
                  <p className="text-xs text-brand-slate">{t.role}</p>
                  <p className="text-xs font-semibold text-brand-blue">{t.organization}</p>
                </div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </Container>
    </Section>
  );
}
