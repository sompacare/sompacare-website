import { siteConfig } from "./data";
import { getServiceLabel, type ContactFormData } from "./contact-validation";

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
      <td style="padding:10px 0;color:#64748b;font-size:13px;font-weight:600;width:140px;vertical-align:top;">${label}</td>
      <td style="padding:10px 0;color:#0f172a;font-size:14px;line-height:1.5;">${escapeHtml(value)}</td>
    </tr>
  `;
}

export function buildStaffNotificationEmail(data: ContactFormData) {
  const serviceLabel = getServiceLabel(data.service);
  const fullName = `${data.firstName} ${data.lastName}`;

  return {
    subject: `New Contact Request — ${fullName} (${data.organization})`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;">
        <div style="background:#0B5ED7;padding:24px 28px;border-radius:16px 16px 0 0;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;">New Contact Form Submission</h1>
          <p style="margin:8px 0 0;color:#dbeafe;font-size:14px;">A visitor submitted a request on sompacare.com</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:28px;border-radius:0 0 16px 16px;background:#ffffff;">
          <table style="width:100%;border-collapse:collapse;">
            ${row("Name", fullName)}
            ${row("Organization", data.organization)}
            ${row("Email", data.email)}
            ${row("Phone", data.phone)}
            ${row("Service", serviceLabel)}
          </table>
          <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e2e8f0;">
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:600;">Message</p>
            <p style="margin:0;color:#0f172a;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(data.message)}</p>
          </div>
        </div>
      </div>
    `,
    text: [
      "New Contact Form Submission",
      "",
      `Name: ${fullName}`,
      `Organization: ${data.organization}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone}`,
      `Service: ${serviceLabel}`,
      "",
      "Message:",
      data.message,
    ].join("\n"),
  };
}

export function buildVisitorConfirmationEmail(data: ContactFormData) {
  const serviceLabel = getServiceLabel(data.service);

  return {
    subject: "We received your message — Sompacare",
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;">
        <div style="background:#0f172a;padding:24px 28px;border-radius:16px 16px 0 0;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;">Thank You, ${escapeHtml(data.firstName)}</h1>
          <p style="margin:8px 0 0;color:#cbd5e1;font-size:14px;">Your message has been received by the Sompacare team.</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:28px;border-radius:0 0 16px 16px;background:#ffffff;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
            A dedicated account specialist will review your request and contact you within one business day.
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#64748b;">Your submission summary</p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#0f172a;">
              <strong>Service:</strong> ${escapeHtml(serviceLabel)}<br />
              <strong>Organization:</strong> ${escapeHtml(data.organization)}
            </p>
          </div>
          <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:#334155;">
            Need urgent staffing? Call us at <a href="${siteConfig.phoneHref}" style="color:#0B5ED7;text-decoration:none;">${siteConfig.phone}</a>
            or email <a href="mailto:${siteConfig.email}" style="color:#0B5ED7;text-decoration:none;">${siteConfig.email}</a>.
          </p>
        </div>
      </div>
    `,
    text: [
      `Thank you, ${data.firstName}.`,
      "",
      "Your message has been received by the Sompacare team.",
      "A dedicated account specialist will review your request and contact you within one business day.",
      "",
      `Service: ${serviceLabel}`,
      `Organization: ${data.organization}`,
      "",
      `Need urgent staffing? Call ${siteConfig.phone} or email ${siteConfig.email}.`,
    ].join("\n"),
  };
}
