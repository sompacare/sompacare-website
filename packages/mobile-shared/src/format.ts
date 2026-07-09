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
