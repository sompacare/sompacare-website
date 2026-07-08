"use client";

import { HealthcareImage } from "@/components/ui/HealthcareImage";
import { AnimatedItem, AnimatedStagger } from "@/components/ui/Animated";
import { type HealthcareImageKey } from "@/lib/healthcare-images";

const heroStripImages: { image: HealthcareImageKey; caption: string }[] = [
  {
    image: "caregiverSupport",
    caption: "CNAs building trust at home",
  },
  {
    image: "clinicalTeam",
    caption: "RNs & CNAs working together",
  },
  {
    image: "nursingCare",
    caption: "Hands-on care where it matters",
  },
];

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

export function RoiPhotoStrip() {
  return (
    <AnimatedStagger className="mb-12 grid gap-4 sm:grid-cols-3">
      {heroStripImages.map(({ image, caption }) => (
        <AnimatedItem key={image}>
          <figure className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-md transition-shadow duration-300 hover:shadow-xl">
            <HealthcareImage
              image={image}
              className="aspect-[4/3] w-full"
              animate={false}
            />
            <figcaption className="border-t border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-brand-navy">
              {caption}
            </figcaption>
          </figure>
        </AnimatedItem>
      ))}
    </AnimatedStagger>
  );
}

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

export function RoiHeroCollage() {
  return (
    <div className="relative mb-10 hidden overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-lg lg:block">
      <div className="grid grid-cols-5 gap-1 p-1">
        <div className="relative col-span-3 min-h-[280px]">
          <HealthcareImage
            image="homeCare"
            className="h-full min-h-[280px] rounded-2xl"
            priority
            immediate
          />
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-tr from-brand-navy/50 via-transparent to-transparent" />
          <p className="absolute bottom-5 left-5 max-w-xs text-lg font-semibold leading-snug text-white">
            CNAs and caregivers sharing laughter and comfort at home
          </p>
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <div className="relative min-h-[138px] flex-1">
            <HealthcareImage image="clinicalTeam" className="h-full min-h-[138px] rounded-2xl" />
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-brand-navy/60 to-transparent" />
            <p className="absolute bottom-3 left-3 text-xs font-semibold text-white">
              Clinical teams in sync
            </p>
          </div>
          <div className="relative min-h-[138px] flex-1">
            <HealthcareImage image="heroTeam" className="h-full min-h-[138px] rounded-2xl" />
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-brand-navy/60 to-transparent" />
            <p className="absolute bottom-3 left-3 text-xs font-semibold text-white">
              RNs leading on the floor
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
