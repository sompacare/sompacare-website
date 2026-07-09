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

export function statusBadgeVariant(
  status: string
): "default" | "success" | "warning" | "blue" {
  switch (status) {
    case "PUBLISHED":
    case "CONFIRMED":
    case "APPROVED":
      return "success";
    case "DRAFT":
    case "PENDING":
    case "PENDING_CONFIRMATION":
      return "warning";
    case "CANCELLED":
    case "REJECTED":
      return "default";
    default:
      return "blue";
  }
}
