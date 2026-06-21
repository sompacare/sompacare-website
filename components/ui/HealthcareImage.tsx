"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { healthcareImages, type HealthcareImageKey } from "@/lib/healthcare-images";

type HealthcareImageProps = {
  image: HealthcareImageKey;
  className?: string;
  priority?: boolean;
  /** Animate on scroll into view */
  animate?: boolean;
  /** Animate immediately on mount (for above-the-fold hero images) */
  immediate?: boolean;
};

export function HealthcareImage({
  image,
  className = "",
  priority = false,
  animate = true,
  immediate = false,
}: HealthcareImageProps) {
  const { src, alt } = healthcareImages[image];
  const containerClass = `relative w-full overflow-hidden ${className}`;

  const img = (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes="(max-width: 768px) 100vw, 50vw"
      className="object-cover"
    />
  );

  if (!animate) {
    return <div className={containerClass}>{img}</div>;
  }

  if (immediate) {
    return (
      <motion.div
        className={containerClass}
        initial={{ opacity: 0, scale: 1.03 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {img}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-navy/40 via-transparent to-transparent" />
      </motion.div>
    );
  }

  return (
    <motion.div
      className={containerClass}
      initial={{ opacity: 0, scale: 1.03 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.02 }}
    >
      {img}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-navy/40 via-transparent to-transparent" />
    </motion.div>
  );
}
