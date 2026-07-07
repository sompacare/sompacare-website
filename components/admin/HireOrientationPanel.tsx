"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  COMPLIANCE_LABELS,
  ORIENTATION_PACKAGE_ITEMS,
  type ComplianceStatus,
  type HireDetails,
  getComplianceProgress,
  getHireReadinessScore,
  isOrientationPackageReady,
  normalizeHireDetails,
} from "@/lib/hire-orientation";

const COMPLIANCE_STATUSES: ComplianceStatus[] = ["not_started", "pending", "cleared", "waived"];

type HireOrientationPanelProps = {
  applicationId: string;
  initialDetails: HireDetails;
  onboardingSentAt: string | null;
  orientationPackageSentAt: string | null;
  isHired: boolean;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase text-brand-slate">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-blue";

export function HireOrientationPanel({
  applicationId,
  initialDetails,
  onboardingSentAt,
  orientationPackageSentAt,
  isHired,
}: HireOrientationPanelProps) {
  const router = useRouter();
  const [details, setDetails] = useState(normalizeHireDetails(initialDetails));
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const readiness = useMemo(() => getHireReadinessScore(details), [details]);
  const compliance = useMemo(() => getComplianceProgress(details), [details]);
  const packageReady = useMemo(() => isOrientationPackageReady(details), [details]);

  if (!isHired) return null;

  function updateField<K extends keyof HireDetails>(key: K, value: HireDetails[K]) {
    setDetails((prev) => ({ ...prev, [key]: value }));
  }

  function updateCompliance(key: keyof HireDetails["compliance"], value: ComplianceStatus) {
    setDetails((prev) => ({
      ...prev,
      compliance: { ...prev.compliance, [key]: value },
    }));
  }

  async function saveDetails() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/hire-details`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hire_details: details }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Unable to save hire details.");
        return;
      }
      setMessage("Hire & orientation details saved.");
      router.refresh();
    } catch {
      setError("Unable to save hire details.");
    } finally {
      setSaving(false);
    }
  }

  async function sendOrientationPackage() {
    setSending(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/orientation-package`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Unable to send orientation package.");
        return;
      }
      setMessage(
        data.onboarding?.relayed
          ? "Orientation package sent via delivery fallback."
          : "Orientation package emailed to applicant and staffing team.",
      );
      router.refresh();
    } catch {
      setError("Unable to send orientation package.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-widest text-emerald-700 uppercase">
              Hire & Orientation Package
            </p>
            <h2 className="mt-1 text-xl font-bold text-brand-navy">Assignment Readiness Center</h2>
            <p className="mt-1 text-sm text-brand-slate">
              Complete assignment, compliance, and orientation details before the clinician&apos;s first day.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white bg-white px-4 py-3 text-center shadow-sm">
              <p className="text-[10px] font-bold tracking-widest text-brand-slate uppercase">Readiness</p>
              <p className="mt-1 text-2xl font-bold text-brand-navy">{readiness}%</p>
            </div>
            <div className="rounded-xl border border-white bg-white px-4 py-3 text-center shadow-sm">
              <p className="text-[10px] font-bold tracking-widest text-brand-slate uppercase">Compliance</p>
              <p className="mt-1 text-2xl font-bold text-brand-navy">
                {compliance.cleared}/{compliance.total}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-brand-navy">Facility Assignment</h3>
          <div className="mt-4 grid gap-4">
            <Field label="Facility / Client Name">
              <input className={inputClass} value={details.facility_name} onChange={(e) => updateField("facility_name", e.target.value)} />
            </Field>
            <Field label="Facility Address">
              <input className={inputClass} value={details.facility_address} onChange={(e) => updateField("facility_address", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Client Contact">
                <input className={inputClass} value={details.client_contact_name} onChange={(e) => updateField("client_contact_name", e.target.value)} />
              </Field>
              <Field label="Client Phone">
                <input className={inputClass} value={details.client_contact_phone} onChange={(e) => updateField("client_contact_phone", e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Assignment Type">
                <select className={inputClass} value={details.assignment_type} onChange={(e) => updateField("assignment_type", e.target.value as HireDetails["assignment_type"])}>
                  <option value="">Select type</option>
                  <option value="per_diem">Per Diem</option>
                  <option value="contract">Contract</option>
                  <option value="travel">Travel</option>
                  <option value="permanent">Permanent</option>
                  <option value="home_health">Home Health</option>
                </select>
              </Field>
              <Field label="Shift Schedule">
                <input className={inputClass} value={details.shift_schedule} onChange={(e) => updateField("shift_schedule", e.target.value)} placeholder="e.g. 7p-7a, 3x12" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start Date">
                <input type="date" className={inputClass} value={details.start_date} onChange={(e) => updateField("start_date", e.target.value)} />
              </Field>
              <Field label="End Date (if applicable)">
                <input type="date" className={inputClass} value={details.end_date} onChange={(e) => updateField("end_date", e.target.value)} />
              </Field>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-brand-navy">Orientation Schedule</h3>
          <div className="mt-4 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Orientation Date">
                <input type="date" className={inputClass} value={details.orientation_date} onChange={(e) => updateField("orientation_date", e.target.value)} />
              </Field>
              <Field label="Orientation Time">
                <input className={inputClass} value={details.orientation_time} onChange={(e) => updateField("orientation_time", e.target.value)} placeholder="e.g. 8:00 AM EST" />
              </Field>
            </div>
            <Field label="Orientation Mode">
              <select className={inputClass} value={details.orientation_mode} onChange={(e) => updateField("orientation_mode", e.target.value as HireDetails["orientation_mode"])}>
                <option value="">Select mode</option>
                <option value="in_person">In Person</option>
                <option value="virtual">Virtual</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </Field>
            <Field label="Orientation Location / Link">
              <input className={inputClass} value={details.orientation_location} onChange={(e) => updateField("orientation_location", e.target.value)} />
            </Field>
            <Field label="Orientation Coordinator">
              <input className={inputClass} value={details.orientation_coordinator} onChange={(e) => updateField("orientation_coordinator", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Reporting Manager">
                <input className={inputClass} value={details.reporting_manager} onChange={(e) => updateField("reporting_manager", e.target.value)} />
              </Field>
              <Field label="Manager Email">
                <input className={inputClass} value={details.reporting_manager_email} onChange={(e) => updateField("reporting_manager_email", e.target.value)} />
              </Field>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-brand-navy">Compensation & Access</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Pay Rate">
              <input className={inputClass} value={details.pay_rate} onChange={(e) => updateField("pay_rate", e.target.value)} placeholder="$48/hr" />
            </Field>
            <Field label="Bill Rate">
              <input className={inputClass} value={details.bill_rate} onChange={(e) => updateField("bill_rate", e.target.value)} placeholder="$72/hr" />
            </Field>
            <Field label="Badge / ID Instructions">
              <input className={inputClass} value={details.employee_id_badge} onChange={(e) => updateField("employee_id_badge", e.target.value)} />
            </Field>
            <Field label="Dress Code">
              <input className={inputClass} value={details.dress_code} onChange={(e) => updateField("dress_code", e.target.value)} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Parking / Arrival Instructions">
              <textarea className={inputClass} rows={3} value={details.parking_instructions} onChange={(e) => updateField("parking_instructions", e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-brand-navy">Emergency Contact</h3>
          <div className="mt-4 grid gap-4">
            <Field label="Contact Name">
              <input className={inputClass} value={details.emergency_contact_name} onChange={(e) => updateField("emergency_contact_name", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone">
                <input className={inputClass} value={details.emergency_contact_phone} onChange={(e) => updateField("emergency_contact_phone", e.target.value)} />
              </Field>
              <Field label="Relationship">
                <input className={inputClass} value={details.emergency_contact_relationship} onChange={(e) => updateField("emergency_contact_relationship", e.target.value)} />
              </Field>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-brand-navy">Compliance & Credentialing Checklist</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(COMPLIANCE_LABELS) as Array<keyof HireDetails["compliance"]>).map((key) => (
            <label key={key} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <span className="block text-xs font-semibold text-brand-navy">{COMPLIANCE_LABELS[key]}</span>
              <select
                className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs capitalize"
                value={details.compliance[key]}
                onChange={(e) => updateCompliance(key, e.target.value as ComplianceStatus)}
              >
                {COMPLIANCE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-brand-navy">Orientation Package Contents</h3>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {ORIENTATION_PACKAGE_ITEMS.map((item) => {
            const checked = details.package_items.includes(item);
            return (
              <li key={item}>
                <label className="flex items-start gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...details.package_items, item]
                        : details.package_items.filter((value) => value !== item);
                      updateField("package_items", next);
                    }}
                    className="mt-0.5"
                  />
                  <span>{item}</span>
                </label>
              </li>
            );
          })}
        </ul>
        <div className="mt-4">
          <Field label="Internal Staffing Notes">
            <textarea className={inputClass} rows={4} value={details.internal_notes} onChange={(e) => updateField("internal_notes", e.target.value)} />
          </Field>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-brand-slate">
          {onboardingSentAt && (
            <p>Welcome email sent · {new Date(onboardingSentAt).toLocaleString("en-US")}</p>
          )}
          {orientationPackageSentAt && (
            <p>Orientation package sent · {new Date(orientationPackageSentAt).toLocaleString("en-US")}</p>
          )}
          {!packageReady && (
            <p className="text-amber-700">Add facility, start date, orientation date, and reporting manager before sending the full package.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={saveDetails}
            disabled={saving}
            className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-brand-navy disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Hire Details"}
          </button>
          <button
            type="button"
            onClick={sendOrientationPackage}
            disabled={sending || !packageReady}
            className="rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send Orientation Package"}
          </button>
        </div>
      </div>

      {message && <p className="text-sm font-medium text-brand-green">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
