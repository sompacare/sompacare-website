/** Days-until-expiry thresholds for compliance reminders. */
export const EXPIRY_REMINDER_DAYS = [30, 14, 7] as const;

export type ExpirySeverity = "info" | "warning" | "critical" | "expired";

export function daysUntilExpiry(expiresAt: Date, now = new Date()): number {
  const ms = expiresAt.getTime() - now.getTime();
  return Math.ceil(ms / 86_400_000);
}

export function getExpirySeverity(
  expiresAt: Date,
  now = new Date()
): ExpirySeverity {
  const days = daysUntilExpiry(expiresAt, now);
  if (days <= 0) return "expired";
  if (days <= 7) return "critical";
  if (days <= 14) return "warning";
  if (days <= 30) return "info";
  return "info";
}

export function reminderThreshold(days: number): number | null {
  for (const threshold of EXPIRY_REMINDER_DAYS) {
    if (days <= threshold && days > 0) return threshold;
  }
  return null;
}
