"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Container } from "@/components/ui/Primitives";
import { healthcareImages, type HealthcareImageKey } from "@/lib/healthcare-images";

export function PageHero({
  badge,
  title,
  description,
  image,
}: {
  badge: string;
  title: string;
  description: string;
  image?: HealthcareImageKey;
}) {
  const bgImage = image ? healthcareImages[image] : null;

  return (
    <section className="relative overflow-hidden bg-brand-navy pb-16 pt-12 sm:pb-20 sm:pt-16">
      {bgImage && (
        <>
          <Image
            src={bgImage.src}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-20"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/95 to-brand-navy/80" />
        </>
      )}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-brand-blue/20 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 -left-24 h-64 w-64 rounded-full bg-brand-green/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>
      <Container className="relative">
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center rounded-full border border-brand-green/25 bg-brand-green/10 px-4 py-1.5 text-[11px] font-bold tracking-[0.12em] text-brand-green-light uppercase"
        >
          {badge}
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 max-w-4xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl lg:leading-[1.12]"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-5 max-w-2xl text-lg leading-relaxed text-white/65"
        >
          {description}
        </motion.p>
      </Container>
    </section>
  );
}
