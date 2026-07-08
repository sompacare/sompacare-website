"use client";

import { motion } from "framer-motion";
import { CountUp } from "@/components/ui/CountUp";
import { Container, Section } from "@/components/ui/Primitives";
import { platformStats } from "@/lib/data";

export function AnimatedStatsSection() {
  return (
    <Section className="border-y border-border bg-gradient-to-br from-brand-navy via-brand-blue-dark to-brand-navy !py-16 lg:!py-20">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="text-xs font-bold tracking-[0.2em] text-brand-green-light uppercase">
            By The Numbers
          </p>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
            Sompacare by the Numbers
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6">
          {platformStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm transition-all duration-300 hover:border-brand-green/30 hover:bg-white/10 sm:p-8"
            >
              <p className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                {"display" in stat && stat.display ? (
                  stat.display
                ) : (
                  <CountUp end={stat.end} suffix={stat.suffix} duration={2.5} />
                )}
              </p>
              <p className="mt-2 text-sm font-semibold text-white">{stat.label}</p>
              <p className="mt-1 text-xs text-white/50">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
