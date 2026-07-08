"use client";

import { HealthcareImage } from "@/components/ui/HealthcareImage";
import { AnimatedItem, AnimatedStagger } from "@/components/ui/Animated";
import { type HealthcareImageKey } from "@/lib/healthcare-images";

const careGalleryItems: { image: HealthcareImageKey; title: string; description: string }[] = [
  {
    image: "homeCare",
    title: "Care at home",
    description: "Warm, one-on-one support that keeps patients comfortable and families confident.",
  },
  {
    image: "clinicalTeam",
    title: "Teams that click",
    description: "CNAs, LPNs, and RNs collaborating on every shift for safer, smoother coverage.",
  },
  {
    image: "seniorLiving",
    title: "Facility-ready clinicians",
    description: "Experienced staff who show up prepared for skilled nursing and senior living.",
  },
  {
    image: "medicalStaff",
    title: "Coordinated coverage",
    description: "Reliable staffing that helps your team focus on patients—not open shifts.",
  },
];

export const ROI_ROLE_IMAGES: Record<"cna" | "lpn" | "rn", HealthcareImageKey> = {
  cna: "caregiverSupport",
  lpn: "seniorLiving",
  rn: "clinicalTeam",
};

export function RoiCareGallery() {
  return (
    <div className="mt-20 border-t border-slate-200/80 pt-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center rounded-full border border-brand-blue/20 bg-brand-blue/5 px-4 py-1.5 text-[11px] font-bold tracking-[0.12em] text-brand-blue uppercase">
          Real care, real impact
        </span>
        <h2 className="mt-5 text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">
          Better staffing means better moments for patients
        </h2>
        <p className="mt-3 text-base leading-relaxed text-brand-slate">
          Sompacare connects facilities with clinicians who bring compassion, teamwork, and
          reliability to every assignment.
        </p>
      </div>

      <AnimatedStagger className="mt-12 grid gap-5 sm:grid-cols-2">
        {careGalleryItems.map(({ image, title, description }) => (
          <AnimatedItem key={image}>
            <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="relative">
                <HealthcareImage image={image} className="aspect-[16/10] w-full" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-navy/80 via-brand-navy/20 to-transparent" />
                <div className="absolute right-0 bottom-0 left-0 p-5 sm:p-6">
                  <h3 className="text-lg font-bold text-white">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/80">{description}</p>
                </div>
              </div>
            </article>
          </AnimatedItem>
        ))}
      </AnimatedStagger>
    </div>
  );
}
