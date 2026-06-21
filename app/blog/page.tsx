"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ConversionCTASection } from "@/components/sections/ConversionCTASection";
import { PageHero } from "@/components/ui/PageHero";
import { Container, Section, SectionHeading } from "@/components/ui/Primitives";
import { blogPosts } from "@/lib/data";

const categoryColors: Record<string, string> = {
  "Industry Insights": "bg-brand-blue/10 text-brand-blue",
  "Workforce Management": "bg-brand-green/10 text-brand-green",
  "Staffing Trends": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  Compliance: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "Staffing Strategy": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  "Long-Term Care": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

export default function BlogPage() {
  return (
    <SiteLayout>
      <main>
        <PageHero
          badge="Blog"
          title="Healthcare Staffing Insights & Industry Trends"
          description="Expert perspectives on healthcare staffing, workforce management, nurse retention, and compliance from the Sompacare leadership team."
        />
        <Section className="bg-background">
          <Container>
            <SectionHeading
              badge="Latest Articles"
              title="Stay Ahead of Workforce Challenges"
              description="Actionable insights for healthcare administrators, nursing directors, and workforce leaders."
            />
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {blogPosts.map((post, i) => (
                <motion.article
                  key={post.slug}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <Link
                    href={`/blog/${post.slug}`}
                    className="card-hover flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-surface-elevated"
                  >
                    <div className="h-40 bg-gradient-to-br from-brand-blue/20 via-brand-navy/10 to-brand-green/20" />
                    <div className="flex flex-1 flex-col p-6">
                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-bold tracking-wide uppercase ${categoryColors[post.category] ?? "bg-surface text-muted"}`}
                      >
                        {post.category}
                      </span>
                      <h2 className="mt-4 text-lg font-bold text-foreground">{post.title}</h2>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{post.excerpt}</p>
                      <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-muted">
                        <span>{post.author}</span>
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </Link>
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
