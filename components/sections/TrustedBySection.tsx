"use client";

import { motion } from "framer-motion";
import { BuildingIcon } from "@/components/icons";
import { Container, Section } from "@/components/ui/Primitives";
import { trustedOrganizations } from "@/lib/data";

function OrgLogo({ name, abbr, color }: { name: string; abbr: string; color: string }) {
  return (
    <div className="flex shrink-0 items-center gap-3.5 rounded-2xl border border-border bg-surface-elevated px-6 py-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-blue/25 hover:shadow-md">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {abbr}
      </div>
      <div>
        <p className="text-sm font-bold whitespace-nowrap text-foreground">{name}</p>
        <p className="text-[10px] font-medium tracking-wide text-muted uppercase">
          Healthcare Partner
        </p>
      </div>
      <BuildingIcon className="ml-2 h-4 w-4 shrink-0 text-muted/40" />
    </div>
  );
}

export function TrustedBySection() {
  const doubled = [...trustedOrganizations, ...trustedOrganizations];

  return (
    <Section className="border-b border-border bg-background !py-14 lg:!py-16">
      <Container>
        <p className="text-center text-xs font-bold tracking-[0.2em] text-muted uppercase">
          Trusted By Healthcare Organizations
        </p>
        <div className="relative mt-10 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-background to-transparent sm:w-32" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-background to-transparent sm:w-32" />
          <motion.div
            className="flex w-max gap-5"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
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
