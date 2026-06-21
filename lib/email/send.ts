import "server-only";

import { Resend } from "resend";
import { getResendFromEmail, getResendSandboxInbox } from "@/lib/contact-server";

export type TransactionalEmail = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Production destination shown in relay banner when sandbox routing is used */
  intendedRecipient?: string;
  tags?: { name: string; value: string }[];
};

export type EmailDeliveryResult = {
  ok: boolean;
  id?: string;
  relayed?: boolean;
  error?: string;
};

function normalizeRecipients(to: string | string[]): string[] {
  return (Array.isArray(to) ? to : [to]).map((email) => email.trim()).filter(Boolean);
}

function isDeliveryRestriction(error: { message?: string; statusCode?: number | null }): boolean {
  const message = (error.message ?? "").toLowerCase();
  return (
    error.statusCode === 403 ||
    error.statusCode === 422 ||
    message.includes("testing emails") ||
    message.includes("verify a domain") ||
    message.includes("resend.dev") ||
    message.includes("invalid from") ||
    message.includes("not verified")
  );
}

function wrapRelayEmail(
  html: string,
  text: string,
  subject: string,
  intendedRecipient: string,
): { html: string; text: string; subject: string } {
  return {
    subject: `[Sompacare Relay] ${subject}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;">
        <div style="background:#0f172a;color:#fff;padding:16px 20px;border-radius:12px 12px 0 0;">
          <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#93c5fd;">Sompacare Delivery Relay</p>
          <p style="margin:6px 0 0;font-size:14px;color:#e2e8f0;">Production recipient: <strong>${intendedRecipient}</strong></p>
          <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">Domain verification pending — message routed to sandbox inbox.</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;overflow:hidden;">
          ${html}
        </div>
      </div>
    `,
    text: [
      "Sompacare Delivery Relay",
      `Production recipient: ${intendedRecipient}`,
      "Domain verification pending — message routed to sandbox inbox.",
      "",
      text,
    ].join("\n"),
  };
}

export async function sendTransactionalEmail(
  email: TransactionalEmail,
): Promise<EmailDeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured." };
  }

  const resend = new Resend(apiKey);
  const from = getResendFromEmail();
  const recipients = normalizeRecipients(email.to);
  const intended = email.intendedRecipient ?? recipients.join(", ");

  const attempt = await resend.emails.send({
    from,
    to: recipients,
    replyTo: email.replyTo,
    subject: email.subject,
    html: email.html,
    text: email.text,
    tags: email.tags,
  });

  if (!attempt.error) {
    return { ok: true, id: attempt.data?.id, relayed: false };
  }

  if (!isDeliveryRestriction(attempt.error)) {
    return { ok: false, error: attempt.error.message };
  }

  const sandboxInbox = getResendSandboxInbox();
  if (!sandboxInbox) {
    return { ok: false, error: attempt.error.message };
  }

  const relay = wrapRelayEmail(email.html, email.text, email.subject, intended);
  const relayAttempt = await resend.emails.send({
    from,
    to: [sandboxInbox],
    replyTo: email.replyTo,
    subject: relay.subject,
    html: relay.html,
    text: relay.text,
    tags: email.tags,
  });

  if (relayAttempt.error) {
    return { ok: false, error: relayAttempt.error.message };
  }

  return { ok: true, id: relayAttempt.data?.id, relayed: true };
}

export async function sendNotificationPair(input: {
  staff: TransactionalEmail;
  recipient: TransactionalEmail;
}): Promise<{ staff: EmailDeliveryResult; recipient: EmailDeliveryResult; allOk: boolean }> {
  const [staff, recipient] = await Promise.all([
    sendTransactionalEmail(input.staff),
    sendTransactionalEmail(input.recipient),
  ]);

  return {
    staff,
    recipient,
    allOk: staff.ok && recipient.ok,
  };
}
