"use client";

import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
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

export default function RecruiterTimekeepingPage() {
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
      setError(err instanceof Error ? err.message : "Could not load assignments.");
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
      setError(err instanceof Error ? err.message : "Clock-in failed.");
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
      setError(err instanceof Error ? err.message : "Clock-out failed.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-navy">Timekeeping</h1>
        <p className="mt-1 text-sm text-muted">
          Clock a worker in or out when they forget. Recorded at the shift location.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-2">
          <label className="text-sm font-semibold text-navy">Note</label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </CardContent>
      </Card>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-muted">No assignments need clock actions.</p>
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
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="font-semibold text-navy">
                      {row.worker.firstName} {row.worker.lastName}
                    </p>
                    <p className="text-sm text-muted">
                      {row.shift.title} · {formatWhen(row.shift.startTime)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {canIn && (
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={busyId === row.id}
                        onClick={() => void handleClockIn(row.id)}
                      >
                        Clock in
                      </Button>
                    )}
                    {canOut && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1"
                        disabled={busyId === row.id}
                        onClick={() => void handleClockOut(row.id)}
                      >
                        Clock out
                      </Button>
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
