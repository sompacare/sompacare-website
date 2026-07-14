"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { siteConfig } from "@/lib/data";
import {
  APPLICATION_POSITIONS,
  CERTIFICATION_OPTIONS,
  US_STATES,
} from "@/lib/careers";
import {
  CAREERS_APPLY_EVENT,
  scrollToCareersApply,
} from "@/components/careers/ApplyNowButton";
import {
  validateCareerFields,
  type CareerFormErrors,
} from "@/lib/career-validation";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-brand-navy outline-none transition-all focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20";

const inputErrorClass =
  "w-full rounded-xl border border-red-400 bg-white px-4 py-3.5 text-sm text-brand-navy outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-400/20";

const labelClass =
  "mb-2 block text-xs font-semibold tracking-wide text-brand-navy uppercase";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-500">{message}</p>;
}

function getPositionFromHash(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  const id = hash.startsWith("apply-") ? hash.slice("apply-".length) : hash;
  return APPLICATION_POSITIONS.some((role) => role.id === id) ? id : null;
}

export function CareerApplicationSection() {
  const searchParams = useSearchParams();
  const [confirmation, setConfirmation] = useState<{
    reference: string;
    position: string;
    timeline: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<CareerFormErrors>({});
  const [position, setPosition] = useState("rn");
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [showOtherCert, setShowOtherCert] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setReferralCode(ref.trim().toUpperCase());
  }, [searchParams]);

  useEffect(() => {
    function syncFromHash(shouldScroll: boolean) {
      const fromHash = getPositionFromHash();
      if (!fromHash) return;
      setPosition(fromHash);
      if (shouldScroll) {
        requestAnimationFrame(() => {
          setTimeout(() => scrollToCareersApply(fromHash), 150);
        });
      }
    }

    function onApplyEvent(event: Event) {
      const detail = (event as CustomEvent<{ positionId: string }>).detail;
      if (!detail?.positionId) return;
      if (APPLICATION_POSITIONS.some((role) => role.id === detail.positionId)) {
        setPosition(detail.positionId);
      }
    }

    function onHashChange() {
      syncFromHash(true);
    }

    syncFromHash(window.location.hash.includes("apply-"));
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener(CAREERS_APPLY_EVENT, onApplyEvent);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener(CAREERS_APPLY_EVENT, onApplyEvent);
    };
  }, []);

  function toggleCert(cert: string) {
    setSelectedCerts((prev) => {
      const next = prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert];
      setShowOtherCert(next.includes("Other"));
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("position", position);
    selectedCerts.forEach((cert) => formData.append("certifications", cert));

    const fieldValidation = validateCareerFields(formData);
    if (!fieldValidation.success) {
      setErrors(fieldValidation.errors);
      return;
    }

    const resume = formData.get("resume");
    if (!(resume instanceof File) || resume.size === 0) {
      setErrors({ resume: "Resume is required (PDF or Word, max 5 MB)." });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/careers", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as {
        success?: boolean;
        reference?: string;
        position?: string;
        timeline?: string;
        errors?: CareerFormErrors;
        error?: string;
      };

      if (!response.ok) {
        if (result.errors) setErrors(result.errors);
        else setErrors({ form: result.error ?? "Unable to submit your application." });
        return;
      }

      setConfirmation({
        reference: result.reference ?? "SUBMITTED",
        position: result.position ?? "Your selected role",
        timeline: result.timeline ?? "2–3 business days",
      });
      form.reset();
      setSelectedCerts([]);
      setShowOtherCert(false);
    } catch {
      setErrors({ form: "Unable to submit. Check your connection and try again." });
    } finally {
      setLoading(false);
    }
  }

  if (confirmation) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="overflow-hidden rounded-3xl border border-brand-green/20 bg-white shadow-lg"
      >
        <div className="bg-gradient-to-r from-brand-navy to-brand-blue px-8 py-8 text-white sm:px-10">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl">
              ✓
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-brand-green-light uppercase">
                Application Received
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight">You&apos;re in our talent pipeline</h3>
              <p className="mt-2 text-sm text-white/75">
                Reference <span className="font-mono font-semibold text-white">{confirmation.reference}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-8 py-8 sm:px-10">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold tracking-wide text-brand-slate uppercase">Position</p>
              <p className="mt-2 text-sm font-semibold text-brand-navy">{confirmation.position}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold tracking-wide text-brand-slate uppercase">Review Timeline</p>
              <p className="mt-2 text-sm font-semibold text-brand-navy">{confirmation.timeline}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-xs font-bold tracking-wide text-brand-slate uppercase">What happens next</p>
            <ol className="mt-4 space-y-3 text-sm text-brand-slate">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-xs font-bold text-brand-blue">1</span>
                Our talent team reviews your credentials and resume.
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-xs font-bold text-brand-blue">2</span>
                A recruiter may contact you to confirm availability and licensing.
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-xs font-bold text-brand-blue">3</span>
                Qualified candidates are matched to open assignments nationwide.
              </li>
            </ol>
          </div>

          <p className="text-center text-sm text-brand-slate">
            A confirmation email is on its way. Questions? Call{" "}
            <a href={siteConfig.phoneHref} className="font-semibold text-brand-blue hover:underline">
              {siteConfig.phone}
            </a>
            {" "}or email{" "}
            <a href="mailto:careers@sompacare.com" className="font-semibold text-brand-blue hover:underline">
              careers@sompacare.com
            </a>
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate encType="multipart/form-data">
      {referralCode && (
        <div className="rounded-xl border border-brand-green/25 bg-brand-green/5 px-4 py-3 text-sm text-brand-navy">
          Referred by code <span className="font-bold">{referralCode}</span> — thank you for applying through a Sompacare clinician.
        </div>
      )}
      <input type="hidden" name="referralCode" value={referralCode} />
      {errors.form && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errors.form}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="applyFirstName" className={labelClass}>First Name *</label>
          <input id="applyFirstName" name="firstName" required className={errors.firstName ? inputErrorClass : inputClass} />
          <FieldError message={errors.firstName} />
        </div>
        <div>
          <label htmlFor="applyLastName" className={labelClass}>Last Name *</label>
          <input id="applyLastName" name="lastName" required className={errors.lastName ? inputErrorClass : inputClass} />
          <FieldError message={errors.lastName} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="applyEmail" className={labelClass}>Email *</label>
          <input id="applyEmail" name="email" type="email" required className={errors.email ? inputErrorClass : inputClass} />
          <FieldError message={errors.email} />
        </div>
        <div>
          <label htmlFor="applyPhone" className={labelClass}>Phone *</label>
          <input id="applyPhone" name="phone" type="tel" required className={errors.phone ? inputErrorClass : inputClass} placeholder="(240) 555-0100" />
          <FieldError message={errors.phone} />
        </div>
      </div>

      <div>
        <label htmlFor="applyAddress" className={labelClass}>Street Address *</label>
        <input id="applyAddress" name="addressLine1" required className={errors.addressLine1 ? inputErrorClass : inputClass} />
        <FieldError message={errors.addressLine1} />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="applyCity" className={labelClass}>City *</label>
          <input id="applyCity" name="city" required className={errors.city ? inputErrorClass : inputClass} />
          <FieldError message={errors.city} />
        </div>
        <div>
          <label htmlFor="applyState" className={labelClass}>State *</label>
          <select id="applyState" name="state" defaultValue="" className={errors.state ? inputErrorClass : inputClass}>
            <option value="" disabled>Select state</option>
            {US_STATES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
          <FieldError message={errors.state} />
        </div>
        <div>
          <label htmlFor="applyZip" className={labelClass}>ZIP *</label>
          <input id="applyZip" name="zip" required className={errors.zip ? inputErrorClass : inputClass} placeholder="12345" />
          <FieldError message={errors.zip} />
        </div>
      </div>

      <div>
        <label htmlFor="applyPosition" className={labelClass}>Position Applying For *</label>
        <select
          id="applyPosition"
          name="position"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className={errors.position ? inputErrorClass : inputClass}
        >
          {APPLICATION_POSITIONS.map((role) => (
            <option key={role.id} value={role.id}>{role.title}</option>
          ))}
        </select>
        <FieldError message={errors.position} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="applyLicenseNumber" className={labelClass}>License / Cert Number *</label>
          <input id="applyLicenseNumber" name="licenseNumber" required className={errors.licenseNumber ? inputErrorClass : inputClass} />
          <FieldError message={errors.licenseNumber} />
        </div>
        <div>
          <label htmlFor="applyLicenseState" className={labelClass}>License State *</label>
          <select id="applyLicenseState" name="licenseState" defaultValue="" className={errors.licenseState ? inputErrorClass : inputClass}>
            <option value="" disabled>Select state</option>
            {US_STATES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
          <FieldError message={errors.licenseState} />
        </div>
      </div>

      <fieldset>
        <legend className={labelClass}>Certifications Held *</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {CERTIFICATION_OPTIONS.map((cert) => (
            <label key={cert} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-brand-navy">
              <input
                type="checkbox"
                checked={selectedCerts.includes(cert)}
                onChange={() => toggleCert(cert)}
                className="rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
              />
              {cert}
            </label>
          ))}
        </div>
        <FieldError message={errors.certifications} />
        {showOtherCert && (
          <div className="mt-3">
            <input
              name="certificationOther"
              placeholder="Describe other certification"
              className={errors.certificationOther ? inputErrorClass : inputClass}
            />
            <FieldError message={errors.certificationOther} />
          </div>
        )}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="applyExperience" className={labelClass}>Years of Experience *</label>
          <select id="applyExperience" name="experience" defaultValue="1-3" className={errors.experience ? inputErrorClass : inputClass}>
            <option value="0-1">Less than 1 year</option>
            <option value="1-3">1–3 years</option>
            <option value="3-5">3–5 years</option>
            <option value="5-10">5–10 years</option>
            <option value="10+">10+ years</option>
          </select>
          <FieldError message={errors.experience} />
        </div>
        <div>
          <label htmlFor="applyAvailability" className={labelClass}>Availability *</label>
          <select id="applyAvailability" name="availability" defaultValue="full-time" className={errors.availability ? inputErrorClass : inputClass}>
            <option value="full-time">Full-Time</option>
            <option value="part-time">Part-Time</option>
            <option value="per-diem">Per Diem</option>
            <option value="contract">Contract / Travel</option>
            <option value="flexible">Flexible</option>
          </select>
          <FieldError message={errors.availability} />
        </div>
      </div>

      <div>
        <label htmlFor="applyResume" className={labelClass}>Resume * (PDF or Word, max 5 MB)</label>
        <input
          id="applyResume"
          name="resume"
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          required
          className={`${errors.resume ? inputErrorClass : inputClass} file:mr-4 file:rounded-lg file:border-0 file:bg-brand-blue/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-blue`}
        />
        <FieldError message={errors.resume} />
      </div>

      <div>
        <label htmlFor="applyCerts" className={labelClass}>Certification Documents (optional, max 5 files)</label>
        <input
          id="applyCerts"
          name="certificationFiles"
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          className={`${errors.certificationFiles ? inputErrorClass : inputClass} file:mr-4 file:rounded-lg file:border-0 file:bg-brand-blue/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-blue`}
        />
        <FieldError message={errors.certificationFiles} />
      </div>

      <div>
        <label htmlFor="applyNotes" className={labelClass}>Additional Notes</label>
        <textarea
          id="applyNotes"
          name="additionalNotes"
          rows={3}
          className={`${errors.additionalNotes ? inputErrorClass : inputClass} resize-none`}
          placeholder="Specialties, preferred shifts, or anything else we should know..."
        />
        <FieldError message={errors.additionalNotes} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <label className="flex items-start gap-3 text-sm text-brand-navy">
          <input
            type="checkbox"
            name="privacyAgreed"
            value="true"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
          />
          <span>
            I agree to Sompacare&apos;s{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-blue hover:underline">
              Privacy Policy
            </a>{" "}
            and{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-blue hover:underline">
              Terms of Service
            </a>
            , and consent to the processing of my application data.
          </span>
        </label>
        <FieldError message={errors.privacyAgreed} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-brand-blue px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-brand-blue/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Submitting Application..." : "Submit Application"}
      </button>

      <p className="text-center text-xs text-brand-slate">
        Questions? Call{" "}
        <a href={siteConfig.phoneHref} className="font-semibold text-brand-blue hover:underline">{siteConfig.phone}</a>
        {" "}or email{" "}
        <a href="mailto:careers@sompacare.com" className="font-semibold text-brand-blue hover:underline">careers@sompacare.com</a>
      </p>
    </form>
  );
}
