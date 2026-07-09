"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { MapPin, LogIn, LogOut } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import type { Assignment } from "@/lib/api";
import { getCurrentPosition, facilityFallbackPosition } from "@/lib/geolocation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatShiftTime,
  formatCurrency,
  estimateShiftEarnings,
  getClockWindowState,
  formatClockWindowOpens,
} from "@/lib/utils";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "success" | "warning" | "blue" }> = {
  PENDING_CONFIRMATION: { label: "Awaiting confirmation", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "success" },
  CHECKED_IN: { label: "On shift — clock out when done", variant: "blue" },
  IN_PROGRESS: { label: "In progress", variant: "blue" },
  COMPLETED: { label: "Completed", variant: "default" },
  CANCELLED: { label: "Cancelled", variant: "default" },
};

export default function AssignmentsPage() {
  const { userId } = useAuth();
  const api = useApi();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  async function resolveCoords(assignment: Assignment) {
    try {
      return await getCurrentPosition();
    } catch {
      return facilityFallbackPosition(assignment.shift);
    }
  }

  async function handleConfirm(id: string) {
    setActingId(id);
    setError(null);
    try {
      await api.confirmAssignment(id);
      setAssignments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "CONFIRMED" } : a))
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActingId(null);
    }
  }

  async function handleClockIn(assignment: Assignment) {
    setActingId(assignment.id);
    setError(null);
    try {
      const coords = await resolveCoords(assignment);
      await api.clockIn(assignment.id, coords);
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignment.id ? { ...a, status: "CHECKED_IN" } : a
        )
      );
    } catch (e) {
      const body = (e as { body?: { message?: string } }).body;
      setError(body?.message ?? (e as Error).message);
    } finally {
      setActingId(null);
    }
  }

  async function handleClockOut(assignment: Assignment) {
    setActingId(assignment.id);
    setError(null);
    try {
      const coords = await resolveCoords(assignment);
      await api.clockOut(assignment.id, coords);
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignment.id ? { ...a, status: "COMPLETED" } : a
        )
      );
    } catch (e) {
      const body = (e as { body?: { message?: string } }).body;
      setError(body?.message ?? (e as Error).message);
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Your schedule</h1>
        <p className="mt-1 text-sm text-muted">Confirm shifts, then clock in on shift day</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {process.env.NEXT_PUBLIC_GEOFENCE_DEV_BYPASS === "true" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Dev mode: clock-in/out is enabled anytime (geofence and shift window bypassed).
        </div>
      )}

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
            const clockWindow =
              assignment.status === "CONFIRMED"
                ? getClockWindowState(
                    assignment.shift.startTime,
                    assignment.shift.endTime
                  )
                : null;
            const displayStatus =
              clockWindow === "open"
                ? { label: "Ready to clock in", variant: "success" as const }
                : status;

            return (
              <Card key={assignment.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant={displayStatus.variant}>{displayStatus.label}</Badge>
                      <h3 className="mt-2 font-bold text-navy">{assignment.shift.title}</h3>
                      <p className="text-sm text-muted">{assignment.shift.facility.name}</p>
                    </div>
                    <p className="text-lg font-bold text-success">{formatCurrency(earnings)}</p>
                  </div>
                  <p className="mt-3 text-sm text-muted">
                    {date} · {time}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                    <MapPin className="h-3.5 w-3.5" />
                    {assignment.shift.location.city}, {assignment.shift.location.state}
                  </p>

                  {assignment.status === "PENDING_CONFIRMATION" && (
                    <Button
                      className="mt-4 w-full"
                      variant="success"
                      onClick={() => handleConfirm(assignment.id)}
                      disabled={actingId === assignment.id}
                    >
                      {actingId === assignment.id ? "Confirming…" : "Confirm shift"}
                    </Button>
                  )}

                  {assignment.status === "CONFIRMED" && clockWindow === "too_early" && (
                    <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      Clock-in opens {formatClockWindowOpens(assignment.shift.startTime)}.
                      You must also be within 150m of the facility.
                    </p>
                  )}

                  {assignment.status === "CONFIRMED" && clockWindow === "closed" && (
                    <p className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-muted">
                      The clock-in window for this shift has ended.
                    </p>
                  )}

                  {assignment.status === "CONFIRMED" && clockWindow === "open" && (
                    <Button
                      className="mt-4 w-full"
                      onClick={() => handleClockIn(assignment)}
                      disabled={actingId === assignment.id}
                    >
                      <LogIn className="h-4 w-4" />
                      {actingId === assignment.id ? "Clocking in…" : "Clock in at facility"}
                    </Button>
                  )}

                  {(assignment.status === "CHECKED_IN" ||
                    assignment.status === "IN_PROGRESS") && (
                    <Button
                      className="mt-4 w-full"
                      variant="secondary"
                      onClick={() => handleClockOut(assignment)}
                      disabled={actingId === assignment.id}
                    >
                      <LogOut className="h-4 w-4" />
                      {actingId === assignment.id ? "Clocking out…" : "Clock out"}
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
