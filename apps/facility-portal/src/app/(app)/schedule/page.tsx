"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ClipboardCheck, Receipt } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useFacility } from "@/hooks/use-facility";
import type { Assignment, Invoice, Timecard } from "@/lib/api";
import { formatCurrency, formatShiftTime, statusBadgeVariant } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

const STATUS_LABELS: Record<string, string> = {
  PENDING_CONFIRMATION: "Awaiting worker confirm",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked in",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function SchedulePage() {
  const api = useApi();
  const { facility, loading: facilityLoading } = useFacility();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [timecards, setTimecards] = useState<Timecard[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!facility?.id) return;
    setLoading(true);
    try {
      const [assignmentRes, timecardRes, invoiceRes] = await Promise.all([
        api.getAssignments({ facilityId: facility.id, limit: "50" }),
        api.getTimecards({ facilityId: facility.id, status: "SUBMITTED", limit: "20" }),
        api.getInvoices({ facilityId: facility.id, status: "SENT", limit: "10" }),
      ]);
      setAssignments(assignmentRes.data ?? []);
      setTimecards(timecardRes.data ?? []);
      setInvoices(invoiceRes.data ?? []);
    } catch {
      setAssignments([]);
      setTimecards([]);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [api, facility?.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApproveTimecard(id: string) {
    setApprovingId(id);
    try {
      await api.approveTimecard(id);
      setTimecards((prev) => prev.filter((t) => t.id !== id));
      await load();
    } finally {
      setApprovingId(null);
    }
  }

  async function handlePayInvoice(id: string) {
    setPayingId(id);
    try {
      await api.payInvoice(id);
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Staff schedule</h1>
        <p className="mt-1 text-sm text-muted">Assignments and timecard approvals</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-navy">Timecards to approve</h2>
        {facilityLoading || loading ? (
          <Skeleton className="h-24 w-full" />
        ) : timecards.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No timecards pending"
            description="Submitted timecards from clocked-out shifts will appear here for approval."
          />
        ) : (
          timecards.map((tc) => (
            <Card key={tc.id} className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-navy">
                      {tc.worker.firstName} {tc.worker.lastName}
                    </p>
                    <p className="text-sm text-muted">{tc.assignment.shift.title}</p>
                    <p className="mt-1 text-sm font-semibold text-navy">
                      {Number(tc.regularHours).toFixed(1)} hrs ·{" "}
                      {formatCurrency(Number(tc.grossAmount))}
                    </p>
                  </div>
                  <Badge variant="warning">SUBMITTED</Badge>
                </div>
                <Button
                  className="mt-3 w-full"
                  variant="success"
                  size="sm"
                  onClick={() => handleApproveTimecard(tc.id)}
                  disabled={approvingId === tc.id}
                >
                  <Check className="h-4 w-4" />
                  {approvingId === tc.id ? "Approving…" : "Approve timecard"}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-navy">Invoices to pay</h2>
        {facilityLoading || loading ? (
          <Skeleton className="h-24 w-full" />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No open invoices"
            description="Invoices are created when you approve timecards."
          />
        ) : (
          invoices.map((inv) => (
            <Card key={inv.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-navy">{inv.invoiceNumber}</p>
                    <p className="text-sm text-muted">
                      Due {new Date(inv.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-navy">
                    {formatCurrency(Number(inv.total))}
                  </p>
                </div>
                <Button
                  className="mt-3 w-full"
                  size="sm"
                  onClick={() => handlePayInvoice(inv.id)}
                  disabled={payingId === inv.id}
                >
                  {payingId === inv.id ? "Processing…" : "Pay invoice"}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-navy">Assignments</h2>
        {facilityLoading || loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="font-semibold text-navy">No assignments yet</p>
              <p className="mt-2 text-sm text-muted">
                Approve applicants to schedule staff on your shifts.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => {
              const { date, time } = formatShiftTime(a.shift.startTime, a.shift.endTime);
              return (
                <Card key={a.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-navy">{a.shift.title}</p>
                        <p className="text-sm text-muted">{date} · {time}</p>
                      </div>
                      <Badge variant={statusBadgeVariant(a.status)}>
                        {STATUS_LABELS[a.status] ?? a.status}
                      </Badge>
                    </div>
                    {a.worker && (
                      <p className="mt-2 text-sm text-navy">
                        {a.worker.firstName} {a.worker.lastName}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
