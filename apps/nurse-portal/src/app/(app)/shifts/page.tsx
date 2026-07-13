"use client";

import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import type { Shift } from "@/lib/api";
import { ShiftCard } from "@/components/shifts/shift-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const ROLE_FILTERS = ["ALL", "RN", "LPN", "CNA", "GNA", "CMA", "MED_TECH"] as const;

const ROLE_LABELS: Record<(typeof ROLE_FILTERS)[number], string> = {
  ALL: "All",
  RN: "RN",
  LPN: "LPN",
  CNA: "CNA",
  GNA: "GNA",
  CMA: "CMA",
  MED_TECH: "Med Tech",
};

export default function ShiftsPage() {
  const api = useApi();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [roleFilter, setRoleFilter] = useState<(typeof ROLE_FILTERS)[number]>("ALL");
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());

  const loadShifts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "20" };
      if (roleFilter !== "ALL") params.role = roleFilter;

      const [recs, assignmentRes] = await Promise.all([
        api.getRecommendedShifts(20).catch(() => null),
        api.getAssignments({ limit: "20" }).catch(() => ({ data: [] })),
      ]);

      let shiftList: Shift[] = [];
      if (recs?.recommendations?.length) {
        shiftList = recs.recommendations
          .map((r) => ({ ...r.shift, matchScore: r.score }))
          .filter((s) => roleFilter === "ALL" || s.role === roleFilter);
      } else {
        const shiftRes = await api.getShifts(params);
        shiftList = shiftRes.data ?? [];
      }

      setShifts(shiftList);
      const appliedShiftIds = new Set(
        (assignmentRes.data ?? []).map((a) => a.shift.id)
      );
      setClaimedIds(appliedShiftIds);
    } catch {
      setShifts([]);
    } finally {
      setLoading(false);
    }
  }, [api, roleFilter]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  async function handleClaim(shift: Shift) {
    setClaimingId(shift.id);
    try {
      await api.applyToShift(shift.id, "Claimed via Sompacare Nurse Portal");
      setClaimedIds((prev) => new Set(prev).add(shift.id));
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Shift marketplace</h1>
        <p className="mt-1 text-sm text-muted">
          AI-ranked shifts matched to your profile
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ROLE_FILTERS.map((role) => (
          <Button
            key={role}
            size="sm"
            variant={roleFilter === role ? "primary" : "secondary"}
            onClick={() => setRoleFilter(role)}
          >
            {role === "ALL" ? "All roles" : ROLE_LABELS[role]}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : shifts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-semibold text-navy">No shifts match your filters</p>
          <p className="mt-2 text-sm text-muted">Try a different role or check back later.</p>
          <Button className="mt-4" variant="secondary" onClick={() => setRoleFilter("ALL")}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {shifts.map((shift) => (
            <div key={shift.id}>
              {claimedIds.has(shift.id) ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-success">
                  <p className="font-semibold">Application submitted for {shift.title}</p>
                  <p className="mt-1 text-xs">Open <strong>Schedule</strong> to confirm your shift.</p>
                </div>
              ) : (
                <ShiftCard
                  shift={shift}
                  onClaim={handleClaim}
                  claiming={claimingId === shift.id}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
