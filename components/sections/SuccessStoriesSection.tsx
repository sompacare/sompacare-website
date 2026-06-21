"use client";

import { motion } from "framer-motion";
import { Container, Section, SectionHeading } from "@/components/ui/Primitives";
import { successStories } from "@/lib/data";

export function SuccessStoriesSection() {
  return (
    <Section id="success-stories" className="bg-background">
      <Container>
        <SectionHeading
          badge="Success Stories"
          title="Transforming Healthcare Workforces Nationwide"
          description="Real outcomes from Fox Chase Health Care, Genesis Healthcare, Paramount Senior Living, and other partners who trust Sompacare."
        />

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {successStories.map((story, i) => (
            <motion.article
              key={story.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="card-hover group flex flex-col rounded-3xl border border-border bg-surface-elevated p-8 shadow-sm transition-shadow duration-300 hover:shadow-xl"
            >
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md"
                  style={{ backgroundColor: story.color }}
                >
                  {story.initials}
                </motion.div>
                <div>
                  <p className="text-sm font-bold text-foreground">{story.author}</p>
                  <p className="text-xs text-muted">{story.role}</p>
                </div>
              </div>

              <span className="mt-6 inline-flex w-fit rounded-full bg-brand-blue/10 px-3 py-1 text-[10px] font-bold tracking-wide text-brand-blue uppercase">
                {story.industry}
              </span>

              <h3 className="mt-4 text-lg font-bold text-foreground transition-colors group-hover:text-brand-blue">
                {story.title}
              </h3>
              <p className="mt-1 text-sm font-semibold text-brand-green">{story.organization}</p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">{story.summary}</p>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="mt-6 rounded-2xl border border-brand-green/20 bg-brand-green/5 p-4"
              >
                <p className="text-[10px] font-bold tracking-wide text-brand-green uppercase">Impact</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{story.impact}</p>
              </motion.div>
            </motion.article>
          ))}
        </div>
      </Container>
    </Section>
  );
}
