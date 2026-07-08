"use client";

import { motion } from "framer-motion";
import { GlobeIcon } from "@/components/icons";
import { Container, Section, SectionHeading } from "@/components/ui/Primitives";
import { coverageStates } from "@/lib/data";

export function LocationsSection() {
  return (
    <Section id="locations" className="bg-slate-50">
      <Container>
        <SectionHeading
          badge="Our Locations"
          title="Sompacare is available nationwide"
          description="We place CNAs, LPNs, and RNs across hospitals, skilled nursing, senior living, and home care settings in states coast to coast."
        />

        <div className="mt-14 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {coverageStates.map((state, i) => (
            <motion.div
              key={state}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: (i % 12) * 0.03 }}
              className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 text-sm font-medium text-brand-navy shadow-sm"
            >
              <GlobeIcon className="h-4 w-4 shrink-0 text-brand-blue" />
              {state}
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-brand-slate">
          Don&apos;t see your state?{" "}
          <a href="/contact" className="font-semibold text-brand-blue hover:underline">
            Contact us
          </a>{" "}
          — we&apos;re expanding coverage every month.
        </p>
      </Container>
    </Section>
  );
}
