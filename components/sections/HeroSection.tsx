"use client";

import { motion } from "framer-motion";
import { ShieldCheckIcon } from "@/components/icons";
import { HealthcareImage } from "@/components/ui/HealthcareImage";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Primitives";
import { heroStats } from "@/lib/data";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-brand-navy pb-20 sm:pb-28 lg:pb-32">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-brand-blue/25 blur-3xl"
          animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 -left-32 h-96 w-96 rounded-full bg-brand-green/15 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center rounded-full border border-brand-green/25 bg-brand-green/10 px-4 py-1.5 text-[11px] font-bold tracking-[0.12em] text-brand-green-light uppercase"
            >
              Trusted Healthcare Partner
            </motion.span>
            <h1 className="mt-7 text-4xl leading-[1.08] font-bold tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
              Staffing, Home Care &{" "}
              <span className="bg-gradient-to-r from-emerald-300 to-brand-green-light bg-clip-text text-transparent">
                Workforce Solutions
              </span>{" "}
              You Can Trust
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/65">
              From in-home care for families to clinical staffing and HR solutions across the
              nationwide — dependable care and talent, with 24/7 support when it counts.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <PrimaryButton href="/home-care">Explore Home Care</PrimaryButton>
              <SecondaryButton href="/contact#request-staff">Request Staff</SecondaryButton>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative mb-6 grid grid-cols-2 gap-3">
              <HealthcareImage image="heroTeam" className="h-36 rounded-2xl sm:h-44" priority immediate />
              <HealthcareImage image="homeCare" className="mt-6 h-36 rounded-2xl sm:h-44" immediate />
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 rounded-2xl border border-brand-green/30 bg-brand-green px-4 py-2 text-[11px] font-bold tracking-wide text-white shadow-lg"
              >
                24/7 Support
              </motion.div>
              <div className="grid grid-cols-2 gap-4">
                {heroStats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    whileHover={{ scale: 1.04, borderColor: "rgba(16, 185, 129, 0.4)" }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300"
                  >
                    <p className="text-2xl font-bold text-white sm:text-3xl">{stat.value}</p>
                    <p className="mt-1 text-xs font-medium text-white/55">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-brand-blue/20 to-brand-green/15 p-5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-green">
                  <ShieldCheckIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Fully Compliant Placements</p>
                  <p className="text-xs text-white/55">
                    Credentialing, background checks & onboarding included
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
