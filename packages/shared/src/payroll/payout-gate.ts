export type TimecardInvoiceSnapshot = {
  id: string;
  shiftTitle: string;
  invoiceId: string | null;
  invoiceStatus: string | null;
  invoiceNumber: string | null;
};

export function getUnpaidTimecardBlockers(
  timecards: TimecardInvoiceSnapshot[],
  paidStatus = "PAID"
): string[] {
  const unpaid: string[] = [];

  for (const tc of timecards) {
    if (!tc.invoiceId) {
      unpaid.push(
        `${tc.shiftTitle} (timecard ${tc.id.slice(-6)}): no invoice`
      );
      continue;
    }
    if (tc.invoiceStatus !== paidStatus) {
      unpaid.push(
        `${tc.shiftTitle}: invoice ${tc.invoiceNumber ?? tc.invoiceId} is ${tc.invoiceStatus ?? "UNKNOWN"}`
      );
    }
  }

  return unpaid;
}
