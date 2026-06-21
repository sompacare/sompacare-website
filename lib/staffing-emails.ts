import { siteConfig } from "./data";
import {
  getStaffingRoleLabel,
  getStaffingUrgencyLabel,
  type StaffingFormData,
} from "./staffing-validation";

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

export function buildStaffingStaffEmail(data: StaffingFormData) {
  return {
    subject: `Staff Request — ${data.organization} (${getStaffingRoleLabel(data.roleNeeded)})`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;">
        <div style="background:#0B5ED7;padding:24px 28px;border-radius:16px 16px 0 0;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;">New Staffing Request</h1>
          <p style="margin:8px 0 0;color:#dbeafe;font-size:14px;">Submitted via sompacare.com</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:28px;border-radius:0 0 16px 16px;background:#ffffff;">
          <table style="width:100%;border-collapse:collapse;">
            ${row("Contact", data.contactName)}
            ${row("Organization", data.organization)}
            ${row("Email", data.email)}
            ${row("Phone", data.phone)}
            ${row("Staff Needed", getStaffingRoleLabel(data.roleNeeded))}
            ${row("Quantity", data.numberNeeded)}
            ${row("Shift Details", data.shiftDetails)}
            ${row("Start Date", data.startDate)}
            ${row("Urgency", getStaffingUrgencyLabel(data.urgency))}
          </table>
          <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e2e8f0;">
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:600;">Details</p>
            <p style="margin:0;color:#0f172a;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(data.message)}</p>
          </div>
        </div>
      </div>
    `,
    text: [
      "New Staffing Request",
      "",
      `Contact: ${data.contactName}`,
      `Organization: ${data.organization}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone}`,
      `Staff: ${getStaffingRoleLabel(data.roleNeeded)} x ${data.numberNeeded}`,
      `Shifts: ${data.shiftDetails}`,
      `Start: ${data.startDate}`,
      `Urgency: ${getStaffingUrgencyLabel(data.urgency)}`,
      "",
      data.message,
    ].join("\n"),
  };
}

export function buildStaffingConfirmationEmail(data: StaffingFormData) {
  return {
    subject: "We received your staffing request — Sompacare",
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;">
        <div style="background:#0f172a;padding:24px 28px;border-radius:16px 16px 0 0;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;">Request Received</h1>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:28px;border-radius:0 0 16px 16px;background:#ffffff;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
            Hi ${escapeHtml(data.contactName)}, thank you for contacting Sompacare. Our staffing team
            received your request for ${escapeHtml(getStaffingRoleLabel(data.roleNeeded))} coverage
            and will respond shortly — 24/7 for urgent needs.
          </p>
          <p style="margin:0;font-size:14px;color:#64748b;">Call ${siteConfig.phone} for immediate assistance.</p>
        </div>
      </div>
    `,
    text: [
      `Hi ${data.contactName},`,
      "",
      "We received your staffing request and will respond shortly.",
      `Call ${siteConfig.phone} for urgent needs.`,
    ].join("\n"),
  };
}
