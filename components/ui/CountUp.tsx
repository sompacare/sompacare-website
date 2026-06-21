"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, motion } from "framer-motion";

type CountUpProps = {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
};

export function CountUp({ end, suffix = "", prefix = "", duration = 2, className = "" }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);

  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !inView) return;

    let frame: number;
    const start = performance.now();
    const durationMs = duration * 1000;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * end));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [mounted, inView, end, duration]);

  if (!mounted) {
    return <span className={className}>—</span>;
  }

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </motion.span>
  );
}
