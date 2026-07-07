import { getCareersEmail } from "@/lib/contact-server";
import { siteConfig } from "@/lib/data";
import {
  COMPLIANCE_LABELS,
  getComplianceProgress,
  normalizeHireDetails,
} from "@/lib/hire-orientation";
import { getOnboardingPortalUrl } from "@/lib/onboarding-email";
import type { ApplicationRecord } from "@/lib/supabase/types";
import { capitalize, formatDate } from "@/lib/format";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function detailRow(label: string, value: string) {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:#64748b;width:42%;">${escapeHtml(label)}</td>
      <td style="padding:8px 0;font-size:13px;font-weight:600;color:#0f172a;">${escapeHtml(value)}</td>
    </tr>
  `;
}

function formatReference(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function buildOrientationPackageApplicantEmail(application: ApplicationRecord) {
  const details = normalizeHireDetails(application.hire_details);
  const reference = formatReference(application.id);
  const portalUrl = getOnboardingPortalUrl();
  const careersEmail = getCareersEmail();

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;color:#0f172a;background:#f8fafc;padding:24px 12px;">
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 55%,#059669 100%);padding:30px 28px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#86efac;">Orientation Package</p>
          <h1 style="margin:0;color:#ffffff;font-size:26px;line-height:1.25;">Your Sompacare assignment is confirmed</h1>
          <p style="margin:12px 0 0;color:#dbeafe;font-size:15px;line-height:1.6;">
            ${escapeHtml(application.first_name)}, your orientation package for <strong style="color:#fff;">${escapeHtml(application.position_label)}</strong> is ready.
          </p>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#334155;">
            Reference <strong>${reference}</strong>. Please review the assignment details below and arrive prepared for orientation.
          </p>

          <h2 style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;">Assignment Summary</h2>
          <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            ${detailRow("Facility", details.facility_name)}
            ${detailRow("Location", details.facility_address)}
            ${detailRow("Assignment Type", details.assignment_type ? capitalize(details.assignment_type) : "")}
            ${detailRow("Start Date", details.start_date ? formatDate(details.start_date) : "")}
            ${detailRow("Shift", details.shift_schedule)}
            ${detailRow("Reporting Manager", details.reporting_manager)}
          </table>

          <h2 style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;">Orientation Details</h2>
          <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            ${detailRow("Orientation Date", details.orientation_date ? formatDate(details.orientation_date) : "")}
            ${detailRow("Orientation Time", details.orientation_time)}
            ${detailRow("Mode", details.orientation_mode ? capitalize(details.orientation_mode) : "")}
            ${detailRow("Location / Link", details.orientation_location)}
            ${detailRow("Coordinator", details.orientation_coordinator)}
          </table>

          ${details.parking_instructions ? `<div style="margin:0 0 24px;padding:16px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;"><p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;">Arrival Instructions</p><p style="margin:0;font-size:14px;line-height:1.6;color:#334155;">${escapeHtml(details.parking_instructions)}</p></div>` : ""}

          <h2 style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;">Included in Your Package</h2>
          <ul style="margin:0 0 24px;padding-left:20px;color:#334155;font-size:14px;line-height:1.8;">
            ${details.package_items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>

          <div style="text-align:center;margin:24px 0;">
            <a href="${escapeHtml(portalUrl)}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:999px;">Confirm Orientation Details</a>
          </div>

          <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;text-align:center;">
            Questions? Contact ${careersEmail} or ${siteConfig.phone}.
          </p>
        </div>
      </div>
    </div>
  `;

  const text = [
    `Orientation package — ${application.position_label}`,
    `Reference: ${reference}`,
    "",
    "Assignment:",
    `Facility: ${details.facility_name}`,
    `Start: ${details.start_date || "TBD"}`,
    `Shift: ${details.shift_schedule || "TBD"}`,
    `Manager: ${details.reporting_manager || "TBD"}`,
    "",
    "Orientation:",
    `Date: ${details.orientation_date || "TBD"}`,
    `Time: ${details.orientation_time || "TBD"}`,
    `Location: ${details.orientation_location || "TBD"}`,
    "",
    "Package items:",
    ...details.package_items.map((item) => `- ${item}`),
    "",
    `Confirm: ${portalUrl}`,
  ].join("\n");

  return {
    subject: `Orientation Package — ${application.position_label} at ${details.facility_name || "Sompacare"} [${reference}]`,
    html,
    text,
  };
}

export function buildOrientationPackageStaffEmail(application: ApplicationRecord) {
  const details = normalizeHireDetails(application.hire_details);
  const reference = formatReference(application.id);
  const compliance = getComplianceProgress(details);
  const fullName = `${application.first_name} ${application.last_name}`;

  const complianceRows = (Object.keys(COMPLIANCE_LABELS) as Array<keyof typeof COMPLIANCE_LABELS>)
    .map((key) => `${COMPLIANCE_LABELS[key]}: ${details.compliance[key].replace(/_/g, " ")}`)
    .join("<br />");

  return {
    subject: `Orientation package sent — ${fullName} · ${details.facility_name || "Assignment pending"}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;color:#0f172a;">
        <div style="background:#0f172a;padding:20px 24px;border-radius:14px 14px 0 0;">
          <h1 style="margin:0;color:#fff;font-size:18px;">Orientation Package Dispatched</h1>
          <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Staffing operations notification</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 14px 14px;">
          <p style="margin:0 0 12px;font-size:14px;"><strong>${escapeHtml(fullName)}</strong> · ${escapeHtml(application.position_label)}</p>
          <p style="margin:0 0 8px;font-size:13px;color:#475569;">Facility: ${escapeHtml(details.facility_name || "—")}</p>
          <p style="margin:0 0 8px;font-size:13px;color:#475569;">Start: ${escapeHtml(details.start_date || "—")} · Shift: ${escapeHtml(details.shift_schedule || "—")}</p>
          <p style="margin:0 0 8px;font-size:13px;color:#475569;">Orientation: ${escapeHtml(details.orientation_date || "—")} ${escapeHtml(details.orientation_time || "")}</p>
          <p style="margin:0 0 8px;font-size:13px;color:#475569;">Manager: ${escapeHtml(details.reporting_manager || "—")}</p>
          <p style="margin:0 0 16px;font-size:13px;color:#475569;">Compliance cleared: ${compliance.cleared}/${compliance.total}</p>
          <div style="padding:16px;background:#f8fafc;border-radius:12px;font-size:13px;line-height:1.7;color:#334155;">
            ${complianceRows}
          </div>
          ${details.internal_notes ? `<p style="margin:16px 0 0;font-size:13px;color:#475569;"><strong>Notes:</strong> ${escapeHtml(details.internal_notes)}</p>` : ""}
          <p style="margin:16px 0 0;font-size:13px;color:#64748b;">Reference ${reference} · Review: ${siteConfig.url}/admin/applications/${application.id}</p>
        </div>
      </div>
    `,
    text: [
      "Orientation package sent",
      "",
      `Name: ${fullName}`,
      `Facility: ${details.facility_name}`,
      `Start: ${details.start_date}`,
      `Orientation: ${details.orientation_date} ${details.orientation_time}`,
      `Compliance: ${compliance.cleared}/${compliance.total}`,
      `Reference: ${reference}`,
    ].join("\n"),
  };
}
