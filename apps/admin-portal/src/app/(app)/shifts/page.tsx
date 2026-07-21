"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, MapPin, Plus } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import type { ShiftRecord } from "@/lib/api";
import { formatApiError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatWhen(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return {
    date: s.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    time: `${s.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} – ${e.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
  };
}

function statusVariant(status: string): "blue" | "success" | "warning" | "default" {
  if (status === "PUBLISHED") return "success";
  if (status === "DRAFT") return "warning";
  if (status === "FILLED" || status === "COMPLETED") return "blue";
  return "default";
}

export default function AdminShiftsPage() {
  const api = useApi();
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getShifts({ limit: "100" });
      setShifts(res.data ?? []);
    } catch {
      setShifts([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  async function publish(id: string) {
    setPublishingId(id);
    setError(null);
    try {
      await api.publishShift(id);
      await load();
    } catch (err) {
      setError(formatApiError(err, "Could not publish shift."));
    } finally {
      setPublishingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Shifts</h1>
          <p className="mt-1 text-sm text-muted">
            Post Sompacare home care visits or shifts on behalf of client facilities.
          </p>
        </div>
        <LinkButton href="/shifts/new" size="sm">
          <Plus className="h-4 w-4" />
          Post shift
        </LinkButton>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : shifts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="font-semibold text-navy">No shifts posted yet</p>
            <p className="mt-2 text-sm text-muted">
              Create a home care visit at any client address for nurses to claim.
            </p>
            <LinkButton href="/shifts/new" className="mt-4">
              Post first shift
            </LinkButton>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {shifts.map((shift) => {
            const when = formatWhen(shift.startTime, shift.endTime);
            return (
              <Card key={shift.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="blue">{shift.role}</Badge>
                        <Badge variant={statusVariant(shift.status)}>{shift.status}</Badge>
                      </div>
                      <h3 className="mt-2 font-bold text-navy">{shift.title}</h3>
                      <p className="mt-1 text-sm text-muted">{shift.facility.name}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-bold text-navy">
                        ${Number(shift.payRate ?? shift.hourlyRate).toFixed(2)}/hr pay
                      </p>
                      <p className="font-semibold text-muted">
                        ${Number(shift.billRate ?? shift.hourlyRate).toFixed(2)}/hr bill
                      </p>
                      <p className="text-muted">
                        {shift.slotsFilled}/{shift.slotsTotal} filled ·{" "}
                        {shift._count?.applications ?? 0} applicants
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-muted">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-primary" />
                      {when.date} · {when.time}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {shift.location.name} — {shift.location.addressLine1 ?? shift.location.city},{" "}
                      {shift.location.city}, {shift.location.state}
                    </div>
                  </div>
                  {shift.status === "DRAFT" && (
                    <Button
                      type="button"
                      className="mt-4 w-full sm:w-auto"
                      onClick={() => void publish(shift.id)}
                      disabled={publishingId === shift.id}
                    >
                      {publishingId === shift.id ? "Publishing…" : "Publish to marketplace"}
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
