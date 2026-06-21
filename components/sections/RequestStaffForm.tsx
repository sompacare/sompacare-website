"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { siteConfig } from "@/lib/data";
import { STAFFING_ROLE_OPTIONS, validateStaffingForm, type StaffingFormErrors } from "@/lib/staffing-validation";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-brand-navy outline-none transition-all focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20";

const inputErrorClass =
  "w-full rounded-xl border border-red-400 bg-white px-4 py-3.5 text-sm text-brand-navy outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-400/20";

const labelClass = "mb-2 block text-xs font-semibold tracking-wide text-brand-navy uppercase";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-500">{message}</p>;
}

export function RequestStaffForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<StaffingFormErrors>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const formData = new FormData(e.currentTarget);
    const validation = validateStaffingForm(Object.fromEntries(formData.entries()));

    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/staffing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });
      const result = (await response.json()) as { errors?: StaffingFormErrors; error?: string };
      if (!response.ok) {
        setErrors(result.errors ?? { form: result.error ?? "Unable to send request." });
        return;
      }
      setSubmitted(true);
    } catch {
      setErrors({ form: "Unable to send request. Please check your connection." });
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-brand-green/20 bg-brand-green/5 p-10 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-green text-2xl text-white">✓</div>
        <h3 className="mt-5 text-xl font-bold text-brand-navy">Request Received</h3>
        <p className="mt-2 text-sm text-brand-slate">
          Our staffing team received your request. A confirmation email is on its way — call us 24/7
          for urgent coverage at {siteConfig.phone}.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {errors.form && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{errors.form}</div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contactName" className={labelClass}>Contact Name *</label>
          <input id="contactName" name="contactName" className={errors.contactName ? inputErrorClass : inputClass} />
          <FieldError message={errors.contactName} />
        </div>
        <div>
          <label htmlFor="staffOrganization" className={labelClass}>Facility / Organization *</label>
          <input id="staffOrganization" name="organization" className={errors.organization ? inputErrorClass : inputClass} />
          <FieldError message={errors.organization} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="staffEmail" className={labelClass}>Email *</label>
          <input id="staffEmail" name="email" type="email" className={errors.email ? inputErrorClass : inputClass} />
          <FieldError message={errors.email} />
        </div>
        <div>
          <label htmlFor="staffPhone" className={labelClass}>Phone *</label>
          <input id="staffPhone" name="phone" type="tel" className={errors.phone ? inputErrorClass : inputClass} />
          <FieldError message={errors.phone} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="roleNeeded" className={labelClass}>Staff Type Needed *</label>
          <select id="roleNeeded" name="roleNeeded" defaultValue="rn" className={errors.roleNeeded ? inputErrorClass : inputClass}>
            {STAFFING_ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <FieldError message={errors.roleNeeded} />
        </div>
        <div>
          <label htmlFor="numberNeeded" className={labelClass}>Number of Staff *</label>
          <input id="numberNeeded" name="numberNeeded" type="number" min={1} className={errors.numberNeeded ? inputErrorClass : inputClass} />
          <FieldError message={errors.numberNeeded} />
        </div>
      </div>

      <div>
        <label htmlFor="shiftDetails" className={labelClass}>Shift Details *</label>
        <input id="shiftDetails" name="shiftDetails" placeholder="e.g. 7a–7p, weekends, overnight" className={errors.shiftDetails ? inputErrorClass : inputClass} />
        <FieldError message={errors.shiftDetails} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="startDate" className={labelClass}>Estimated Start Date *</label>
          <input id="startDate" name="startDate" type="date" className={errors.startDate ? inputErrorClass : inputClass} />
          <FieldError message={errors.startDate} />
        </div>
        <div>
          <label htmlFor="urgency" className={labelClass}>Urgency *</label>
          <select id="urgency" name="urgency" defaultValue="soon" className={errors.urgency ? inputErrorClass : inputClass}>
            <option value="urgent">Urgent — within 24 hours</option>
            <option value="soon">Within 1 week</option>
            <option value="planned">Planned — 2+ weeks out</option>
          </select>
          <FieldError message={errors.urgency} />
        </div>
      </div>

      <div>
        <label htmlFor="staffMessage" className={labelClass}>Staffing Details *</label>
        <textarea id="staffMessage" name="message" rows={4} className={`${errors.message ? inputErrorClass : inputClass} resize-none`} placeholder="Unit, acuity, credential requirements, contract length..." />
        <FieldError message={errors.message} />
      </div>

      <button type="submit" disabled={loading} className="w-full rounded-full bg-brand-blue px-8 py-4 text-sm font-semibold text-white shadow-lg disabled:opacity-60">
        {loading ? "Sending..." : "Submit Staff Request"}
      </button>
    </form>
  );
}
