"use client";

import { useCallback, useEffect, useState } from "react";
import { useApi, formatApiError } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type AssignmentRow = {
  id: string;
  status: string;
  worker: { firstName: string; lastName: string; email: string };
  shift: {
    title: string;
    role: string;
    startTime: string;
    endTime: string;
    facility: { name: string };
    location: { city: string; state: string; addressLine1?: string };
  };
  clockEvents?: Array<{ type: string; timestamp: string }>;
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TimekeepingPage() {
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const [note, setNote] = useState("Worker forgot to clock — manual override");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAssignments({
        statuses: "CONFIRMED,CHECKED_IN,IN_PROGRESS",
        limit: "50",
      });
      setRows(res.data ?? []);
    } catch (err) {
      setError(formatApiError(err, "Could not load assignments."));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleClockIn(id: string) {
    setBusyId(id);
    try {
      await api.proxyClockIn(id, note);
      await load();
    } catch (err) {
      setError(formatApiError(err, "Clock-in failed."));
    } finally {
      setBusyId(null);
    }
  }

  async function handleClockOut(id: string) {
    setBusyId(id);
    try {
      await api.proxyClockOut(id, note);
      await load();
    } catch (err) {
      setError(formatApiError(err, "Clock-out failed."));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Timekeeping</h1>
        <p className="mt-1 text-sm text-muted">
          Clock workers in or out on their behalf when they forget. Uses the shift location
          coordinates and is recorded in the audit log.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-2">
          <label className="text-sm font-semibold text-navy">Audit note (optional)</label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </CardContent>
      </Card>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-muted">No active assignments need clock actions right now.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const hasIn = row.clockEvents?.some((e) => e.type === "CLOCK_IN");
            const hasOut = row.clockEvents?.some((e) => e.type === "CLOCK_OUT");
            const canIn = row.status === "CONFIRMED" && !hasIn;
            const canOut =
              (row.status === "CHECKED_IN" || row.status === "IN_PROGRESS") && hasIn && !hasOut;

            return (
              <Card key={row.id}>
                <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-navy">
                      {row.worker.firstName} {row.worker.lastName}
                    </p>
                    <p className="text-sm text-muted">{row.worker.email}</p>
                    <p className="mt-1 text-sm text-navy">
                      {row.shift.title} · {row.shift.role} · {row.shift.facility.name}
                    </p>
                    <p className="text-xs text-muted">
                      {formatWhen(row.shift.startTime)} – {formatWhen(row.shift.endTime)}
                      {row.shift.location.addressLine1
                        ? ` · ${row.shift.location.addressLine1}, ${row.shift.location.city}`
                        : ""}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase text-muted">
                      {row.status.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {canIn && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={busyId === row.id}
                        onClick={() => void handleClockIn(row.id)}
                      >
                        Clock in
                      </Button>
                    )}
                    {canOut && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={busyId === row.id}
                        onClick={() => void handleClockOut(row.id)}
                      >
                        Clock out
                      </Button>
                    )}
                    {!canIn && !canOut && (
                      <span className="text-xs text-muted self-center">No action</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
