"use client";

import Link from "next/link";
import { MotionDiv } from "@/components/ui/Animated";
import { Container } from "@/components/ui/Primitives";
import { BuildingIcon, UsersIcon } from "@/components/icons";

export function StaffingPageHero() {
  return (
    <section className="relative overflow-hidden bg-brand-navy pb-16 pt-28 sm:pb-20 sm:pt-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-blue/20 blur-3xl" />
      </div>
      <Container className="relative text-center">
        <MotionDiv>
          <span className="inline-flex items-center rounded-full border border-brand-green/25 bg-brand-green/10 px-4 py-1.5 text-[11px] font-bold tracking-[0.12em] text-brand-green-light uppercase">
            Healthcare Staffing
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl leading-[1.08] font-bold tracking-tight text-white sm:text-5xl">
            Qualified CNAs, LPNs &amp; RNs — delivered fast
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/65">
            Per diem, contract, travel, and permanent staffing for hospitals, skilled nursing,
            and senior living facilities nationwide.
          </p>
          <div className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
            <Link
              href="/careers"
              className="inline-flex items-center justify-center gap-3 rounded-2xl bg-brand-blue px-8 py-5 text-base font-semibold text-white shadow-xl shadow-brand-blue/30 transition-all hover:-translate-y-0.5 hover:bg-brand-blue-dark sm:min-w-[260px]"
            >
              <UsersIcon className="h-5 w-5" />
              I am a CNA, LPN, or RN
            </Link>
            <Link
              href="/contact#request-staff"
              className="inline-flex items-center justify-center gap-3 rounded-2xl border-2 border-white/25 bg-white/10 px-8 py-5 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/15 sm:min-w-[260px]"
            >
              <BuildingIcon className="h-5 w-5" />
              I am a facility manager
            </Link>
          </div>
        </MotionDiv>
      </Container>
    </section>
  );
}
