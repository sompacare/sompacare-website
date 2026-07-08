"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BuildingIcon, UsersIcon } from "@/components/icons";
import { HealthcareImage } from "@/components/ui/HealthcareImage";
import { heroStats } from "@/lib/data";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-brand-navy pb-16 pt-28 sm:pb-24 sm:pt-32 lg:pb-32 lg:pt-36">
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
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center rounded-full border border-brand-green/25 bg-brand-green/10 px-4 py-1.5 text-[11px] font-bold tracking-[0.12em] text-brand-green-light uppercase">
              Nationwide Healthcare Staffing
            </span>
            <h1 className="mt-7 text-4xl leading-[1.08] font-bold tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
              Sompacare connects CNAs, LPNs, &amp; RNs to per diem shifts at healthcare facilities
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/65">
              See why facilities and clinicians trust Sompacare for fast placements, competitive
              rates, and 24/7 support — plus home care and HR solutions when you need them.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center"
          >
            <Link
              href="/careers"
              className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-brand-blue px-8 py-5 text-base font-semibold text-white shadow-xl shadow-brand-blue/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-blue-dark hover:shadow-2xl sm:min-w-[280px]"
            >
              <UsersIcon className="h-5 w-5 shrink-0" />
              I am a CNA, LPN, or RN
            </Link>
            <Link
              href="/contact#request-staff"
              className="group inline-flex items-center justify-center gap-3 rounded-2xl border-2 border-white/25 bg-white/10 px-8 py-5 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/15 sm:min-w-[280px]"
            >
              <BuildingIcon className="h-5 w-5 shrink-0" />
              I am a facility manager
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mt-16 grid items-end gap-8 lg:grid-cols-5 lg:gap-10"
        >
          <div className="relative lg:col-span-3">
            <HealthcareImage
              image="clinicalTeam"
              className="aspect-[16/10] w-full rounded-3xl object-cover shadow-2xl"
              priority
              immediate
            />
            <div className="absolute -bottom-4 -right-4 hidden rounded-2xl border border-brand-green/30 bg-brand-green px-5 py-3 text-sm font-bold text-white shadow-lg sm:block">
              24/7 Shift Support
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:col-span-2">
            {heroStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
              >
                <p className="text-2xl font-bold text-white sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-xs font-medium text-white/55">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
