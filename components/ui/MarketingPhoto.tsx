"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { marketingImages, type MarketingImageKey } from "@/lib/marketing-images";

type MarketingPhotoProps = {
  image: MarketingImageKey;
  className?: string;
  priority?: boolean;
  immediate?: boolean;
  overlay?: boolean;
};

export function MarketingPhoto({
  image,
  className = "",
  priority = false,
  immediate = false,
  overlay = true,
}: MarketingPhotoProps) {
  const { src, alt } = marketingImages[image];
  const containerClass = `relative w-full overflow-hidden ${className}`;

  const img = (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes="(max-width: 768px) 100vw, 60vw"
      className="object-cover"
    />
  );

  const overlayEl = overlay ? (
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-navy/45 via-transparent to-transparent" />
  ) : null;

  if (immediate) {
    return (
      <motion.div
        className={containerClass}
        initial={{ opacity: 0, scale: 1.03 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {img}
        {overlayEl}
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
      {overlayEl}
    </motion.div>
  );
}
