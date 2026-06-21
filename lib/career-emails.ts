import { siteConfig } from "./data";
import {
  getAvailabilityLabel,
  getExperienceLabel,
  getPositionLabel,
  type CareerFormFields,
} from "./career-validation";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:10px 0;color:#64748b;font-size:13px;font-weight:600;width:160px;vertical-align:top;">${label}</td>
      <td style="padding:10px 0;color:#0f172a;font-size:14px;line-height:1.5;">${escapeHtml(value)}</td>
    </tr>
  `;
}

export function buildCareerStaffEmail(
  data: CareerFormFields,
  extras?: { applicationId?: string; resumeFileName?: string; certCount?: number },
) {
  const fullName = `${data.firstName} ${data.lastName}`;
  const positionLabel = getPositionLabel(data.position);
  const address = `${data.addressLine1}, ${data.city}, ${data.state} ${data.zip}`;

  return {
    subject: `New Application — ${fullName} (${positionLabel})`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;">
        <div style="background:#059669;padding:24px 28px;border-radius:16px 16px 0 0;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;">New Career Application</h1>
          <p style="margin:8px 0 0;color:#d1fae5;font-size:14px;">Submitted via sompacare.com/careers</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:28px;border-radius:0 0 16px 16px;background:#ffffff;">
          ${extras?.applicationId ? row("Application ID", extras.applicationId) : ""}
          <table style="width:100%;border-collapse:collapse;">
            ${row("Name", fullName)}
            ${row("Email", data.email)}
            ${row("Phone", data.phone)}
            ${row("Address", address)}
            ${row("Position", positionLabel)}
            ${row("License #", data.licenseNumber)}
            ${row("License State", data.licenseState)}
            ${row("Certifications", data.certifications.join(", "))}
            ${row("Experience", getExperienceLabel(data.experience))}
            ${row("Availability", getAvailabilityLabel(data.availability))}
            ${row("Resume", extras?.resumeFileName ?? "Attached in ATS")}
            ${row("Certification Files", String(extras?.certCount ?? 0))}
          </table>
          ${
            data.additionalNotes
              ? `<div style="margin-top:20px;padding-top:20px;border-top:1px solid #e2e8f0;">
                  <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:600;">Additional Notes</p>
                  <p style="margin:0;color:#0f172a;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(data.additionalNotes)}</p>
                </div>`
              : ""
          }
          <p style="margin-top:20px;font-size:13px;color:#64748b;">Review in the admin dashboard: ${siteConfig.url}/admin/applications</p>
        </div>
      </div>
    `,
    text: [
      "New Career Application",
      extras?.applicationId ? `Application ID: ${extras.applicationId}` : "",
      "",
      `Name: ${fullName}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone}`,
      `Address: ${address}`,
      `Position: ${positionLabel}`,
      `License: ${data.licenseNumber} (${data.licenseState})`,
      `Certifications: ${data.certifications.join(", ")}`,
      `Experience: ${getExperienceLabel(data.experience)}`,
      `Availability: ${getAvailabilityLabel(data.availability)}`,
      data.additionalNotes ? `\nNotes:\n${data.additionalNotes}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function buildCareerApplicantEmail(data: CareerFormFields, reference?: string) {
  const positionLabel = getPositionLabel(data.position);
  const refLine = reference
    ? `<p style="margin:0 0 20px;padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;font-size:13px;color:#475569;">
        Application reference: <strong style="color:#0f172a;letter-spacing:0.06em;">${escapeHtml(reference)}</strong>
      </p>`
    : "";

  return {
    subject: `Application received — Sompacare (${reference ?? "Careers"})`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;">
        <div style="background:#0f172a;padding:24px 28px;border-radius:16px 16px 0 0;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;">Thank You, ${escapeHtml(data.firstName)}</h1>
          <p style="margin:8px 0 0;color:#cbd5e1;font-size:14px;">Your application has been received and is under review.</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:28px;border-radius:0 0 16px 16px;background:#ffffff;">
          ${refLine}
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
            We received your application for <strong>${escapeHtml(positionLabel)}</strong>.
            Our talent acquisition team will review your qualifications and contact you within 2–3 business days.
          </p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">
            Questions? Call ${siteConfig.phone} or email careers@sompacare.com.
          </p>
        </div>
      </div>
    `,
    text: [
      `Thank you, ${data.firstName}!`,
      reference ? `Application reference: ${reference}` : "",
      "",
      `We received your application for ${positionLabel}.`,
      "Our talent team will review it and contact you within 2–3 business days.",
      "",
      `Questions? Call ${siteConfig.phone}.`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}
