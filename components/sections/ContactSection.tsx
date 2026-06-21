"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MailIcon, MapPinIcon, PhoneIcon } from "@/components/icons";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Primitives";
import { CONTACT_SERVICES, validateContactForm, type ContactFormErrors } from "@/lib/contact-validation";
import { siteConfig } from "@/lib/data";

const inputClass =
  "w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-brand-navy outline-none transition-all focus:ring-2 focus:ring-brand-blue/20";

function fieldClass(hasError: boolean): string {
  return `${inputClass} ${hasError ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-brand-blue"}`;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-500">{message}</p>;
}

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ContactFormErrors>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const validation = validateContactForm(payload);

    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      const result = (await response.json()) as {
        success?: boolean;
        errors?: ContactFormErrors;
        error?: string;
      };

      if (!response.ok) {
        if (result.errors) {
          setErrors(result.errors);
        } else {
          setErrors({ form: result.error ?? "Unable to send your message. Please try again." });
        }
        return;
      }

      setSubmitted(true);
    } catch {
      setErrors({ form: "Unable to send your message. Please check your connection and try again." });
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
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-green text-2xl text-white">
          ✓
        </div>
        <h3 className="mt-5 text-xl font-bold text-brand-navy">Thank You!</h3>
        <p className="mt-2 text-sm text-brand-slate">
          Your message has been received and a confirmation email is on its way. A Sompacare
          specialist will contact you within one business day.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {errors.form && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errors.form}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-2 block text-xs font-semibold tracking-wide text-brand-navy uppercase">
            First Name
          </label>
          <input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            className={fieldClass(!!errors.firstName)}
            placeholder="Jane"
            aria-invalid={!!errors.firstName}
            aria-describedby={errors.firstName ? "firstName-error" : undefined}
          />
          <FieldError message={errors.firstName} />
        </div>
        <div>
          <label htmlFor="lastName" className="mb-2 block text-xs font-semibold tracking-wide text-brand-navy uppercase">
            Last Name
          </label>
          <input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            className={fieldClass(!!errors.lastName)}
            placeholder="Smith"
            aria-invalid={!!errors.lastName}
          />
          <FieldError message={errors.lastName} />
        </div>
      </div>

      <div>
        <label htmlFor="organization" className="mb-2 block text-xs font-semibold tracking-wide text-brand-navy uppercase">
          Organization
        </label>
        <input
          id="organization"
          name="organization"
          autoComplete="organization"
          className={fieldClass(!!errors.organization)}
          placeholder="Fox Chase Health Care"
          aria-invalid={!!errors.organization}
        />
        <FieldError message={errors.organization} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="mb-2 block text-xs font-semibold tracking-wide text-brand-navy uppercase">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={fieldClass(!!errors.email)}
            placeholder="jane@hospital.org"
            aria-invalid={!!errors.email}
          />
          <FieldError message={errors.email} />
        </div>
        <div>
          <label htmlFor="phone" className="mb-2 block text-xs font-semibold tracking-wide text-brand-navy uppercase">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={fieldClass(!!errors.phone)}
            placeholder="(240) 676-1208"
            aria-invalid={!!errors.phone}
          />
          <FieldError message={errors.phone} />
        </div>
      </div>

      <div>
        <label htmlFor="service" className="mb-2 block text-xs font-semibold tracking-wide text-brand-navy uppercase">
          Service Needed
        </label>
        <select
          id="service"
          name="service"
          defaultValue="consultation"
          className={fieldClass(!!errors.service)}
          aria-invalid={!!errors.service}
        >
          {CONTACT_SERVICES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FieldError message={errors.service} />
      </div>

      <div>
        <label htmlFor="message" className="mb-2 block text-xs font-semibold tracking-wide text-brand-navy uppercase">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className={`${fieldClass(!!errors.message)} resize-none`}
          placeholder="Tell us how we can help..."
          aria-invalid={!!errors.message}
        />
        <FieldError message={errors.message} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-brand-blue px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-brand-blue/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-blue-dark hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {loading ? "Sending..." : "Submit Request"}
      </button>
    </form>
  );
}

export function ContactSection({ compact = false }: { compact?: boolean }) {
  return (
    <section
      id="contact"
      className={`relative overflow-hidden bg-gradient-to-br from-brand-blue via-brand-blue-dark to-brand-navy ${compact ? "py-20 sm:py-28" : "py-20 sm:py-28 lg:py-32"}`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-green/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {!compact && (
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-brand-green/25 bg-brand-green/10 px-4 py-1.5 text-[11px] font-bold tracking-[0.12em] text-brand-green-light uppercase">
              Contact Us
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Build a Stronger Healthcare Workforce Today
            </h2>
            <p className="mt-5 text-lg text-white/65">
              Partner with Sompacare to solve staffing shortages, streamline recruitment,
              and build a compliant, high-performing clinical team.
            </p>
          </div>
        )}

        <div className={`grid gap-10 ${compact ? "" : "mt-16"} lg:grid-cols-5 lg:gap-14`}>
          <div className="lg:col-span-3">
            <div className="rounded-3xl border border-white/10 bg-white p-8 shadow-2xl sm:p-10">
              <h3 className="text-xl font-bold text-brand-navy">Send Us a Message</h3>
              <p className="mt-2 text-sm text-brand-slate">
                Complete the form and a dedicated account specialist will respond within
                one business day.
              </p>
              <div className="mt-8">
                <ContactForm />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 lg:col-span-2">
            {[
              {
                icon: PhoneIcon,
                label: "Phone",
                value: siteConfig.phone,
                href: siteConfig.phoneHref,
              },
              {
                icon: MailIcon,
                label: "Email",
                value: siteConfig.email,
                href: `mailto:${siteConfig.email}`,
              },
              {
                icon: MapPinIcon,
                label: "Office",
                value: siteConfig.address.full,
                href: `https://maps.google.com/?q=${encodeURIComponent(siteConfig.address.full)}`,
              },
            ].map((item) => (
              <motion.a
                key={item.label}
                href={item.href}
                target={item.label === "Office" ? "_blank" : undefined}
                rel={item.label === "Office" ? "noopener noreferrer" : undefined}
                whileHover={{ x: 4 }}
                className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-green/20">
                  <item.icon className="h-5 w-5 text-brand-green-light" />
                </div>
                <div>
                  <p className="text-xs font-bold tracking-wide text-white/50 uppercase">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">{item.value}</p>
                </div>
              </motion.a>
            ))}

            <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white">Need urgent staffing?</p>
              <p className="mt-1 text-xs text-white/55">
                Our team is available 24/7 for critical coverage requests.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <PrimaryButton href="/contact" className="!w-full !justify-center !text-xs">
                  Request Staff
                </PrimaryButton>
                <SecondaryButton href="/contact" className="!w-full !justify-center !text-xs">
                  Schedule Consultation
                </SecondaryButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
