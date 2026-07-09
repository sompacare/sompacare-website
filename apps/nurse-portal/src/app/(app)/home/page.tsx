"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Sparkles, Wallet } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import type { Assignment, Shift } from "@/lib/api";
import { ShiftCard } from "@/components/shifts/shift-card";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, estimateShiftEarnings } from "@/lib/utils";

export default function HomePage() {
  const { user } = useUser();
  const api = useApi();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [complianceOk, setComplianceOk] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [shiftRes, assignmentRes, complianceRes] = await Promise.all([
          api.getShifts({ limit: "6" }),
          api.getAssignments({ limit: "5" }),
          api.getCompliance(),
        ]);
        if (cancelled) return;
        setShifts(shiftRes.data ?? []);
        setAssignments(assignmentRes.data ?? []);
        setComplianceOk(complianceRes.data?.isCompliant ?? true);
      } catch {
        if (!cancelled) {
          setShifts([]);
          setAssignments([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const firstName = user?.firstName ?? "there";
  const weeklyEarnings = assignments
    .filter((a) => ["CONFIRMED", "PENDING_CONFIRMATION", "CHECKED_IN"].includes(a.status))
    .reduce((sum, a) => {
      const rate = Number(a.shift.hourlyRate);
      return sum + estimateShiftEarnings(rate, a.shift.startTime, a.shift.endTime);
    }, 0);

  const pendingConfirm = assignments.filter((a) => a.status === "PENDING_CONFIRMATION");

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-muted">Good morning,</p>
        <h1 className="text-2xl font-bold text-navy">{firstName} 👋</h1>
        {!complianceOk && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Some credentials need attention.{" "}
            <Link href="/credentials" className="font-semibold underline">
              View credentials
            </Link>
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted">
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">This week</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-navy">
              {loading ? "—" : formatCurrency(weeklyEarnings)}
            </p>
            <Link href="/wallet" className="mt-1 text-xs font-semibold text-primary">
              View wallet →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Open shifts</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-navy">
              {loading ? "—" : shifts.length}
            </p>
          </CardContent>
        </Card>
      </section>

      {pendingConfirm.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy">Confirm your shifts</h2>
            <Link href="/assignments" className="text-sm font-semibold text-primary">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {pendingConfirm.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold text-navy">{a.shift.title}</p>
                    <p className="text-sm text-muted">{a.shift.facility.name}</p>
                  </div>
                  <Badge variant="warning">Confirm</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {!loading && assignments.length > 0 && pendingConfirm.length === 0 && (
        <EmptyState
          icon={CalendarCheck}
          title="No shifts awaiting confirmation"
          description="When a facility approves you, confirm the assignment from your schedule."
          action={{ label: "View schedule", href: "/assignments" }}
        />
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">Recommended shifts</h2>
          <Link href="/shifts" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
            Browse all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : shifts.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No open shifts right now"
            description="Check back soon or browse the marketplace for new opportunities."
            action={{ label: "Browse shifts", href: "/shifts" }}
          />
        ) : (
          <div className="space-y-3">
            {shifts.slice(0, 3).map((shift) => (
              <ShiftCard key={shift.id} shift={shift} compact />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
