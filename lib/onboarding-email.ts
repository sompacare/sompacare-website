import { getCareersEmail } from "@/lib/contact-server";
import { normalizeHireDetails } from "@/lib/hire-orientation";
import { formatDate } from "@/lib/format";
import { siteConfig } from "@/lib/data";
import type { ApplicationRecord } from "@/lib/supabase/types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatReference(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function getOnboardingPortalUrl(): string {
  const custom = process.env.ONBOARDING_PORTAL_URL?.trim();
  if (custom) return custom;
  return `${siteConfig.url}/contact`;
}

function checklistItem(number: string, title: string, detail: string): string {
  return `
    <tr>
      <td style="vertical-align:top;padding:0 16px 20px 0;width:36px;">
        <div style="width:28px;height:28px;border-radius:999px;background:#059669;color:#fff;font-size:13px;font-weight:700;line-height:28px;text-align:center;">${number}</div>
      </td>
      <td style="vertical-align:top;padding:0 0 20px;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#0f172a;">${title}</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#475569;">${detail}</p>
      </td>
    </tr>
  `;
}

function documentPill(label: string): string {
  return `<span style="display:inline-block;margin:0 8px 8px 0;padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:999px;font-size:12px;font-weight:600;color:#334155;">${label}</span>`;
}

export function buildOnboardingWelcomeEmail(application: ApplicationRecord) {
  const firstName = escapeHtml(application.first_name);
  const position = escapeHtml(application.position_label);
  const reference = formatReference(application.id);
  const portalUrl = getOnboardingPortalUrl();
  const careersEmail = getCareersEmail();
  const hire = normalizeHireDetails(application.hire_details);

  const assignmentBlock =
    hire.facility_name || hire.start_date
      ? `
          <div style="margin:0 0 24px;padding:18px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;">
            <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#1d4ed8;">Assignment preview</p>
            ${hire.facility_name ? `<p style="margin:0 0 6px;font-size:14px;color:#334155;"><strong>Facility:</strong> ${escapeHtml(hire.facility_name)}</p>` : ""}
            ${hire.start_date ? `<p style="margin:0 0 6px;font-size:14px;color:#334155;"><strong>Start date:</strong> ${formatDate(hire.start_date)}</p>` : ""}
            ${hire.orientation_date ? `<p style="margin:0;font-size:14px;color:#334155;"><strong>Orientation:</strong> ${formatDate(hire.orientation_date)} ${escapeHtml(hire.orientation_time)}</p>` : ""}
          </div>
        `
      : "";

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;background:#f8fafc;padding:24px 12px;">
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,0.08);">
        <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 55%,#059669 100%);padding:32px 28px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#86efac;">Welcome to Sompacare</p>
          <h1 style="margin:0;color:#ffffff;font-size:28px;line-height:1.25;font-weight:700;">Congratulations, ${firstName}!</h1>
          <p style="margin:12px 0 0;color:#dbeafe;font-size:15px;line-height:1.6;">
            We are delighted to welcome you to the Sompacare clinical team as <strong style="color:#ffffff;">${position}</strong>.
          </p>
        </div>

        <div style="padding:28px;">
          <div style="margin:0 0 24px;padding:16px 18px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#047857;">Your onboarding reference</p>
            <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:0.08em;color:#0f172a;">${reference}</p>
            <p style="margin:8px 0 0;font-size:13px;line-height:1.5;color:#475569;">Please include this reference in all onboarding correspondence.</p>
          </div>

          <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#334155;">
            Your offer is confirmed. To ensure a smooth start, our Talent Acquisition &amp; Compliance team will guide you through credentialing, orientation scheduling, and assignment readiness.
          </p>

          ${assignmentBlock}

          <h2 style="margin:0 0 16px;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;">Your next steps</h2>
          <table role="presentation" style="width:100%;border-collapse:collapse;">
            ${checklistItem(
              "1",
              "Complete your onboarding profile",
              "Confirm contact details, emergency information, and assignment preferences within 48 hours.",
            )}
            ${checklistItem(
              "2",
              "Verify credentials &amp; certifications",
              "Ensure your professional license, CPR/BLS, and role-specific certifications are current and upload any updates.",
            )}
            ${checklistItem(
              "3",
              "Schedule orientation",
              "A member of our team will contact you to confirm your start date, facility assignment, and orientation time.",
            )}
            ${checklistItem(
              "4",
              "Review compliance materials",
              "Complete required acknowledgments including HIPAA, workplace safety, and facility-specific policies before your first shift.",
            )}
          </table>

          <div style="margin:24px 0;padding:20px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;">
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Documents to have ready</p>
            ${documentPill("Government-issued photo ID")}
            ${documentPill("Active professional license")}
            ${documentPill("CPR / BLS certification")}
            ${documentPill("Role-specific certifications")}
            ${documentPill("Immunization records (if applicable)")}
          </div>

          <div style="text-align:center;margin:28px 0 8px;">
            <a href="${escapeHtml(portalUrl)}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:999px;">
              Begin Onboarding
            </a>
          </div>

          <p style="margin:20px 0 0;text-align:center;font-size:13px;line-height:1.6;color:#64748b;">
            Questions? Contact our Talent Acquisition team at
            <a href="mailto:${careersEmail}" style="color:#2563eb;font-weight:600;text-decoration:none;">${careersEmail}</a>
            or call <a href="${siteConfig.phoneHref}" style="color:#2563eb;font-weight:600;text-decoration:none;">${siteConfig.phone}</a>.
          </p>
        </div>

        <div style="padding:18px 28px;background:#0f172a;text-align:center;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
            ${siteConfig.name} · ${siteConfig.tagline}<br />
            Nationwide · ${siteConfig.phone}
          </p>
        </div>
      </div>
    </div>
  `;

  const text = [
    `Congratulations, ${application.first_name}!`,
    "",
    `Welcome to the Sompacare team as ${application.position_label}.`,
    `Onboarding reference: ${reference}`,
    "",
    "Next steps:",
    "1. Complete your onboarding profile within 48 hours.",
    "2. Verify credentials and upload any updated certifications.",
    "3. Schedule orientation — our team will contact you with start details.",
    "4. Review compliance materials before your first assignment.",
    "",
    "Documents to have ready: photo ID, active license, CPR/BLS, role certifications.",
    "",
    `Begin onboarding: ${portalUrl}`,
    `Questions: ${careersEmail} · ${siteConfig.phone}`,
    "",
    `${siteConfig.name} · Nationwide`,
  ].join("\n");

  return {
    subject: `Welcome to Sompacare — Onboarding for ${application.position_label} [${reference}]`,
    html,
    text,
  };
}

export function buildOnboardingStaffNotification(application: ApplicationRecord) {
  const fullName = `${application.first_name} ${application.last_name}`;
  const reference = formatReference(application.id);
  const hire = normalizeHireDetails(application.hire_details);

  return {
    subject: `Onboarding sent — ${fullName} (${application.position_label})`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;">
        <div style="background:#0f172a;padding:20px 24px;border-radius:14px 14px 0 0;">
          <h1 style="margin:0;color:#fff;font-size:18px;">Onboarding Email Delivered</h1>
          <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Applicant marked as hired in Sompacare ATS</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 14px 14px;">
          <p style="margin:0 0 12px;font-size:14px;"><strong>${escapeHtml(fullName)}</strong> · ${escapeHtml(application.position_label)}</p>
          <p style="margin:0 0 8px;font-size:13px;color:#475569;">Email: ${escapeHtml(application.email)}</p>
          <p style="margin:0 0 8px;font-size:13px;color:#475569;">Phone: ${escapeHtml(application.phone)}</p>
          <p style="margin:0 0 8px;font-size:13px;color:#475569;">License: ${escapeHtml(application.license_number ?? "—")} (${escapeHtml(application.license_state ?? "—")})</p>
          ${hire.facility_name ? `<p style="margin:0 0 8px;font-size:13px;color:#475569;">Facility: ${escapeHtml(hire.facility_name)}</p>` : ""}
          ${hire.start_date ? `<p style="margin:0 0 8px;font-size:13px;color:#475569;">Start date: ${formatDate(hire.start_date)}</p>` : ""}
          <p style="margin:0 0 16px;font-size:13px;color:#475569;">Reference: ${reference}</p>
          <p style="margin:0;font-size:13px;color:#64748b;">Complete hire orientation details: ${siteConfig.url}/admin/applications/${application.id}</p>
        </div>
      </div>
    `,
    text: [
      "Onboarding email delivered",
      "",
      `Name: ${fullName}`,
      `Position: ${application.position_label}`,
      `Email: ${application.email}`,
      `Phone: ${application.phone}`,
      `Reference: ${reference}`,
      "",
      `Review: ${siteConfig.url}/admin/applications/${application.id}`,
    ].join("\n"),
  };
}
