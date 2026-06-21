"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container, Section, SectionHeading } from "@/components/ui/Primitives";
import { howItWorksSteps } from "@/lib/data";

export function HowItWorksSection() {
  const [active, setActive] = useState(0);
  const current = howItWorksSteps[active];

  return (
    <Section id="how-it-works" className="bg-slate-50">
      <Container>
        <SectionHeading
          badge="How It Works"
          title="A Proven Five-Step Process"
          description="From talent request to ongoing partnership — we make workforce solutions seamless, compliant, and efficient for your organization."
        />

        <div className="mt-16 grid gap-10 lg:grid-cols-5">
          <div className="flex flex-row gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {howItWorksSteps.map((step, index) => (
              <button
                key={step.step}
                type="button"
                onClick={() => setActive(index)}
                className={`shrink-0 rounded-2xl border px-5 py-4 text-left transition-all duration-300 lg:w-full ${
                  active === index
                    ? "border-brand-blue bg-brand-blue text-white shadow-lg shadow-brand-blue/25"
                    : "border-slate-200 bg-white text-brand-navy hover:border-brand-blue/30 hover:bg-brand-blue/5"
                }`}
              >
                <span
                  className={`text-xs font-bold tracking-wider ${
                    active === index ? "text-white/70" : "text-brand-blue"
                  }`}
                >
                  STEP {step.step}
                </span>
                <p className="mt-1 text-sm font-bold">{step.title}</p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10 lg:p-12"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-green text-lg font-bold text-white shadow-lg shadow-brand-blue/30">
                  {current.step}
                </div>
                <h3 className="mt-6 text-2xl font-bold text-brand-navy sm:text-3xl">
                  {current.title}
                </h3>
                <p className="mt-4 text-lg leading-relaxed text-brand-slate">
                  {current.description}
                </p>
                <div className="mt-8 rounded-2xl border border-brand-blue/10 bg-brand-blue/5 p-6">
                  <p className="text-sm leading-relaxed text-brand-navy/80">{current.detail}</p>
                </div>

                <div className="mt-8 flex gap-2">
                  {howItWorksSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        index <= active ? "bg-brand-blue" : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </Section>
  );
}
