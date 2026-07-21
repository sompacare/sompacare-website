"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, MapPin, Plus } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import type { ShiftRecord } from "@/lib/api";
import { formatApiError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecruiterShiftsPage() {
  const api = useApi();
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getShifts({ limit: "50" });
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
          <h1 className="text-2xl font-bold text-navy">Home care shifts</h1>
          <p className="mt-1 text-sm text-muted">Post visits at any address for nurses to pick up.</p>
        </div>
        <LinkButton href="/shifts/new" size="sm">
          <Plus className="h-4 w-4" />
          New
        </LinkButton>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : shifts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="font-semibold text-navy">No shifts yet</p>
            <p className="mt-2 text-sm text-muted">Post a home care visit and publish to the nurse app.</p>
            <LinkButton href="/shifts/new" className="mt-4 w-full">
              Post shift
            </LinkButton>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {shifts.map((shift) => (
            <Card key={shift.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="blue">{shift.role}</Badge>
                      <Badge variant={shift.status === "PUBLISHED" ? "success" : "warning"}>
                        {shift.status}
                      </Badge>
                    </div>
                    <h3 className="mt-2 font-bold text-navy">{shift.title}</h3>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-bold text-navy">
                      ${Number(shift.payRate ?? shift.hourlyRate).toFixed(0)}/hr pay
                    </p>
                    <p className="font-semibold text-muted">
                      ${Number(shift.billRate ?? shift.hourlyRate).toFixed(0)}/hr bill
                    </p>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm text-muted">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    {new Date(shift.startTime).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {shift.location.name} · {shift.location.city}, {shift.location.state}
                  </div>
                  <p>
                    {shift.slotsFilled}/{shift.slotsTotal} filled · {shift._count?.applications ?? 0}{" "}
                    applicants
                  </p>
                </div>
                {shift.status === "DRAFT" && (
                  <Button
                    type="button"
                    className="mt-3 w-full"
                    onClick={() => void publish(shift.id)}
                    disabled={publishingId === shift.id}
                  >
                    {publishingId === shift.id ? "Publishing…" : "Publish"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
