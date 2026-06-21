"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ConversionCTASection } from "@/components/sections/ConversionCTASection";
import { PageHero } from "@/components/ui/PageHero";
import { Container, PrimaryButton, Section, SectionHeading } from "@/components/ui/Primitives";
import { resourceCategories, resources } from "@/lib/data";

const typeIcons: Record<string, string> = {
  Guide: "📘",
  Tool: "🔧",
  Whitepaper: "📄",
  Report: "📊",
};

export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const filtered =
    activeCategory === "All"
      ? resources
      : resources.filter((r) => r.category === activeCategory);

  return (
    <SiteLayout>
      <main>
        <PageHero
          badge="Resource Center"
          title="Healthcare Workforce Resources & Tools"
          description="Download guides, whitepapers, checklists, and tools to optimize your healthcare staffing, compliance, and workforce planning strategies."
        />
        <Section className="bg-background">
          <Container>
            <SectionHeading
              badge="Browse Resources"
              title="Expert Content for Healthcare Leaders"
              description="Curated resources from Sompacare's workforce planning and clinical staffing experts."
            />

            <div className="mt-10 flex flex-wrap justify-center gap-2">
              {resourceCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeCategory === cat
                      ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/25"
                      : "border border-border bg-surface-elevated text-muted hover:border-brand-blue/30 hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((resource, i) => (
                <motion.article
                  key={resource.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="card-hover flex flex-col rounded-3xl border border-border bg-surface-elevated p-7"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{typeIcons[resource.type] ?? "📁"}</span>
                    <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-[10px] font-bold tracking-wide text-brand-blue uppercase">
                      {resource.type}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-foreground">{resource.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{resource.description}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted">
                    <span>{resource.format}</span>
                    <span>{resource.pages}</span>
                  </div>
                  <PrimaryButton
                    href="/contact"
                    className="!mt-5 !w-full !justify-center !py-3 !text-xs"
                  >
                    Request Download
                  </PrimaryButton>
                </motion.article>
              ))}
            </div>
          </Container>
        </Section>
        <ConversionCTASection />
      </main>
    </SiteLayout>
  );
}
