"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useApi } from "@/hooks/use-api";
import type { Assignment } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShiftTime, formatCurrency, estimateShiftEarnings } from "@/lib/utils";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "success" | "warning" | "blue" }> = {
  PENDING_CONFIRMATION: { label: "Awaiting confirmation", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "success" },
  CHECKED_IN: { label: "Checked in", variant: "blue" },
  IN_PROGRESS: { label: "In progress", variant: "blue" },
  COMPLETED: { label: "Completed", variant: "default" },
  CANCELLED: { label: "Cancelled", variant: "default" },
};

export default function AssignmentsPage() {
  const { userId } = useAuth();
  const api = useApi();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!userId) return;
      try {
        const res = await api.getAssignments({ limit: "20" });
        if (!cancelled) setAssignments(res.data ?? []);
      } catch {
        if (!cancelled) setAssignments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [api, userId]);

  async function handleConfirm(id: string) {
    setConfirmingId(id);
    try {
      await api.confirmAssignment(id);
      setAssignments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "CONFIRMED" } : a))
      );
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Your schedule</h1>
        <p className="mt-1 text-sm text-muted">Upcoming and confirmed shifts</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="font-semibold text-navy">No assignments yet</p>
            <p className="mt-2 text-sm text-muted">
              Claim a shift from the marketplace to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const { date, time } = formatShiftTime(
              assignment.shift.startTime,
              assignment.shift.endTime
            );
            const earnings = estimateShiftEarnings(
              Number(assignment.shift.hourlyRate),
              assignment.shift.startTime,
              assignment.shift.endTime
            );
            const status = STATUS_LABELS[assignment.status] ?? {
              label: assignment.status,
              variant: "default" as const,
            };

            return (
              <Card key={assignment.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <h3 className="mt-2 font-bold text-navy">{assignment.shift.title}</h3>
                      <p className="text-sm text-muted">{assignment.shift.facility.name}</p>
                    </div>
                    <p className="text-lg font-bold text-success">{formatCurrency(earnings)}</p>
                  </div>
                  <p className="mt-3 text-sm text-muted">
                    {date} · {time}
                  </p>
                  {assignment.status === "PENDING_CONFIRMATION" && (
                    <Button
                      className="mt-4 w-full"
                      variant="success"
                      onClick={() => handleConfirm(assignment.id)}
                      disabled={confirmingId === assignment.id}
                    >
                      {confirmingId === assignment.id ? "Confirming…" : "Confirm shift"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
