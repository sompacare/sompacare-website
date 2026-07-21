"use client";

import { useState } from "react";
import { MapPin, Clock, DollarSign, Zap } from "lucide-react";
import type { Shift } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { estimateShiftEarnings, formatCurrency, formatShiftTime } from "@/lib/utils";

type ShiftCardProps = {
  shift: Shift;
  onClaim?: (shift: Shift) => Promise<void>;
  claiming?: boolean;
  compact?: boolean;
  matchScore?: number;
};

export function ShiftCard({ shift, onClaim, claiming, compact, matchScore }: ShiftCardProps) {
  const [error, setError] = useState<string | null>(null);
  const hourly = Number(shift.hourlyRate);
  const { date, time } = formatShiftTime(shift.startTime, shift.endTime);
  const earnings = estimateShiftEarnings(hourly, shift.startTime, shift.endTime);
  const slotsLeft = shift.slotsTotal - shift.slotsFilled;
  const score = matchScore ?? shift.matchScore;

  async function handleClaim() {
    if (!onClaim) return;
    setError(null);
    try {
      await onClaim(shift);
    } catch (e) {
      const apiErr = e as { body?: { message?: string | string[]; blockedReasons?: string[] }; message?: string };
      const raw = apiErr.body?.message;
      const apiMessage = Array.isArray(raw) ? raw.join(", ") : raw;
      const reasons = apiErr.body?.blockedReasons?.join(", ");
      const fallback = apiErr.message ?? "Could not claim shift";
      const message = reasons ?? apiMessage ?? fallback;
      if (message.includes("already applied")) {
        setError("You already applied to this shift. Open Schedule to confirm.");
      } else {
        setError(message);
      }
    }
  }

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className={compact ? "p-4" : "p-5"}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="blue">{shift.role}</Badge>
              {shift.isEmergency && <Badge variant="warning">Urgent</Badge>}
              <Badge>{shift.shiftType.replace("_", " ")}</Badge>
              {score != null && <Badge variant="success">{score}% match</Badge>}
            </div>
            <h3 className="mt-2 text-base font-bold text-navy">{shift.title}</h3>
            <p className="mt-1 text-sm font-medium text-navy/80">{shift.facility.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-success">{formatCurrency(hourly)}<span className="text-xs font-medium text-muted">/hr</span></p>
            <p className="text-xs text-muted">~{formatCurrency(earnings)}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm text-muted">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-primary" />
            <span>{date} · {time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span>{shift.location.city}, {shift.location.state}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 shrink-0 text-primary" />
            <span>{slotsLeft} of {shift.slotsTotal} spots open</span>
          </div>
        </div>

        {onClaim && slotsLeft > 0 && (
          <Button
            type="button"
            className="mt-4 w-full"
            onClick={() => void handleClaim()}
            disabled={claiming}
          >
            <Zap className="h-4 w-4" />
            {claiming ? "Claiming…" : "Claim shift"}
          </Button>
        )}

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
