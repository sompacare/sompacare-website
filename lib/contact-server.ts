import "server-only";

import { siteConfig } from "./data";

export function getResendFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL ?? "Sompacare <careers@sompacare.com>";
}

export function isResendSandboxMode(): boolean {
  const from = getResendFromEmail().toLowerCase();
  return from.includes("@resend.dev");
}

/** Fallback inbox when Resend sandbox restrictions apply (local dev only) */
export function getResendSandboxInbox(): string | undefined {
  const inbox = process.env.RESEND_SANDBOX_INBOX?.trim();
  return inbox || undefined;
}

export function getInfoEmail(): string {
  return process.env.INFO_TO_EMAIL ?? process.env.CONTACT_TO_EMAIL ?? siteConfig.email;
}

export function getCareersEmail(): string {
  return process.env.CAREERS_TO_EMAIL ?? "careers@sompacare.com";
}

export function getStaffingEmail(): string {
  return process.env.STAFFING_TO_EMAIL ?? "staffing@sompacare.com";
}

/** @deprecated Use getInfoEmail(), getCareersEmail(), or getStaffingEmail() */
export function getContactRecipientEmail(): string {
  return getInfoEmail();
}
