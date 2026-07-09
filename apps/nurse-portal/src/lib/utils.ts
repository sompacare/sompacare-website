import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatShiftTime(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const dateFmt = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return {
    date: dateFmt.format(startDate),
    time: `${timeFmt.format(startDate)} – ${timeFmt.format(endDate)}`,
  };
}

export function estimateShiftEarnings(hourlyRate: number, start: string, end: string) {
  const hours = (new Date(end).getTime() - new Date(start).getTime()) / 3_600_000;
  return Math.round(hourlyRate * Math.max(hours, 0));
}

/** Matches API timekeeping shift window (30 min before start through 30 min after end). */
export const CLOCK_WINDOW_MS = 30 * 60 * 1000;

export type ClockWindowState = "too_early" | "open" | "closed";

export function getClockWindowState(
  start: string,
  end: string,
  now = Date.now()
): ClockWindowState {
  if (process.env.NEXT_PUBLIC_GEOFENCE_DEV_BYPASS === "true") {
    return "open";
  }

  const windowStart = new Date(start).getTime() - CLOCK_WINDOW_MS;
  const windowEnd = new Date(end).getTime() + CLOCK_WINDOW_MS;
  if (now < windowStart) return "too_early";
  if (now > windowEnd) return "closed";
  return "open";
}

export function formatClockWindowOpens(start: string) {
  const opensAt = new Date(new Date(start).getTime() - CLOCK_WINDOW_MS);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(opensAt);
}
