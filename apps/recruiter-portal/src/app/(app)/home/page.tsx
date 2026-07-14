"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, Kanban, Trophy, Users } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { RecruiterMetrics } from "@/lib/api";

const STAGE_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  PLACED: "Placed",
  HIRED: "Hired",
};

export default function HomePage() {
  const { user } = useUser();
  const api = useApi();
  const [metrics, setMetrics] = useState<RecruiterMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await api.getMetrics();
        if (!cancelled) setMetrics(data);
      } catch {
        if (!cancelled) setMetrics(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const firstName = user?.firstName ?? "Recruiter";

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-muted">Welcome back,</p>
        <h1 className="text-2xl font-bold text-navy">{firstName} 👋</h1>
        <p className="mt-1 text-sm text-muted">Your placement dashboard</p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted">
              <Users className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Active</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-navy">
              {loading ? "—" : (metrics?.activePipeline ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted">
              <Trophy className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Placed</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-navy">
              {loading ? "—" : (metrics?.placedTotal ?? 0)}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Pipeline</h2>
          <Link href="/pipeline" className="text-xs font-semibold text-primary">
            View board
          </Link>
        </div>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(STAGE_LABELS).map(([stage, label]) => (
              <Badge key={stage}>
                {label}: {metrics?.byStage?.[stage] ?? 0}
              </Badge>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Recent placements</h2>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : metrics?.recentPlacements?.length ? (
          <div className="space-y-2">
            {metrics.recentPlacements.map((p) => (
              <Link key={p.id} href={`/candidates/${p.id}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold text-navy">
                        {p.firstName} {p.lastName}
                      </p>
                      <p className="text-xs text-muted">
                        {p.clinicalRole}
                        {p.facility?.name ? ` · ${p.facility.name}` : ""}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No placements yet — move candidates through the pipeline.</p>
        )}
      </section>

      <div className="grid gap-3">
        <Link
          href="/pipeline"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
        >
          <Kanban className="h-4 w-4" />
          Open pipeline
        </Link>
        <Link
          href="/leaderboard"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-navy transition-colors hover:bg-slate-50"
        >
          <Trophy className="h-4 w-4" />
          Leaderboard
        </Link>
      </div>
    </div>
  );
}
