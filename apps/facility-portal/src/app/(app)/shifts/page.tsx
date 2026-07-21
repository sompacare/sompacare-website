"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Clock, MapPin } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useFacility } from "@/hooks/use-facility";
import type { Shift } from "@/lib/api";
import { formatCurrency, formatShiftTime, statusBadgeVariant } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShiftsPage() {
  const api = useApi();
  const { facility, loading: facilityLoading } = useFacility();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const loadShifts = useCallback(async () => {
    if (!facility?.id) return;
    setLoading(true);
    try {
      const res = await api.getShifts({ facilityId: facility.id, limit: "50" });
      setShifts(res.data ?? []);
    } catch {
      setShifts([]);
    } finally {
      setLoading(false);
    }
  }, [api, facility?.id]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  async function handlePublish(id: string) {
    setPublishingId(id);
    try {
      await api.publishShift(id);
      await loadShifts();
    } finally {
      setPublishingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">My shifts</h1>
          <p className="mt-1 text-sm text-muted">Draft, publish, and manage posted shifts</p>
        </div>
        <LinkButton href="/shifts/new" size="sm">
          <Plus className="h-4 w-4" />
          New
        </LinkButton>
      </div>

      {facilityLoading || loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : shifts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="font-semibold text-navy">No shifts yet</p>
            <p className="mt-2 text-sm text-muted">Post your first shift to the marketplace.</p>
            <LinkButton href="/shifts/new" className="mt-4">
              Post a shift
            </LinkButton>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {shifts.map((shift) => {
            const { date, time } = formatShiftTime(shift.startTime, shift.endTime);
            const billRate = Number(shift.billRate ?? shift.hourlyRate);
            return (
              <Card key={shift.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <Link href={`/shifts/${shift.id}`} className="block">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="blue">{shift.role}</Badge>
                        <Badge variant={statusBadgeVariant(shift.status)}>{shift.status}</Badge>
                      </div>
                      <h3 className="mt-2 font-bold text-navy">{shift.title}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">
                        {formatCurrency(billRate)}
                        <span className="text-xs font-medium text-muted">/hr bill</span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-muted">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      {date} · {time}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {shift.location.city}, {shift.location.state}
                    </div>
                    <p>
                      {shift.slotsFilled}/{shift.slotsTotal} filled ·{" "}
                      {shift._count?.applications ?? 0} application(s)
                    </p>
                  </div>
                  </Link>
                  {shift.status === "DRAFT" && (
                    <Button
                      type="button"
                      className="mt-4 w-full"
                      onClick={() => void handlePublish(shift.id)}
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
