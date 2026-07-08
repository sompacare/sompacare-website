"use client";

import { motion } from "framer-motion";
import { BuildingIcon } from "@/components/icons";
import { Container, Section } from "@/components/ui/Primitives";
import { trustedOrganizations } from "@/lib/data";

function OrgLogo({ name, abbr, color }: { name: string; abbr: string; color: string }) {
  return (
    <div className="flex shrink-0 items-center gap-3.5 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-blue/30 hover:shadow-md">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {abbr}
      </div>
      <div>
        <p className="text-sm font-bold whitespace-nowrap text-brand-navy">{name}</p>
        <p className="text-[10px] font-medium tracking-wide text-brand-slate uppercase">
          Nursing Home Partner
        </p>
      </div>
      <BuildingIcon className="ml-2 h-4 w-4 shrink-0 text-brand-slate/50" />
    </div>
  );
}

export function TrustedBySection() {
  const doubled = [...trustedOrganizations, ...trustedOrganizations];

  return (
    <Section className="light-surface border-b border-slate-200 !bg-slate-50 !py-14 lg:!py-16">
      <Container>
        <p className="text-center text-xs font-bold tracking-[0.2em] text-brand-green uppercase">
          Trusted by hundreds of nursing homes
        </p>
        <h2 className="section-title mt-3 text-center text-xl font-bold text-brand-navy sm:text-2xl">
          Partner facilities across the nation trust Sompacare
        </h2>
        <div className="relative mt-10 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-slate-50 to-transparent sm:w-32" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-slate-50 to-transparent sm:w-32" />
          <motion.div
            className="flex w-max gap-5"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          >
            {doubled.map((org, i) => (
              <OrgLogo key={`${org.name}-${i}`} {...org} />
            ))}
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}
