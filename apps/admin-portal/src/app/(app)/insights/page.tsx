"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Star } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import type { InsightsResponse } from "@/lib/api";

export default function InsightsPage() {
  const api = useApi();
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await api.getInsights();
        if (!cancelled) setInsights(data);
      } catch {
        if (!cancelled) setInsights(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-navy">AI insights</h1>
        <p className="mt-1 text-sm text-muted">Activity summary and recommendations</p>
      </section>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : insights ? (
        <>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex gap-3 p-5">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-navy">Summary</p>
                <p className="mt-1 text-sm text-muted">{insights.aiSummary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="blue">{insights.enabledFlags} flags enabled</Badge>
                  {insights.aiDevBypass && <Badge variant="default">Rules engine</Badge>}
                  {insights.pendingCompliance != null && insights.pendingCompliance > 0 && (
                    <Badge variant="warning">{insights.pendingCompliance} pending credentials</Badge>
                  )}
                  {insights.fillRate != null && (
                    <Badge variant="success">{insights.fillRate}% fill rate</Badge>
                  )}
                  {insights.urgentTickets > 0 && (
                    <Badge variant="danger">{insights.urgentTickets} urgent tickets</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Top facilities</h2>
            <div className="space-y-2">
              {insights.topFacilities.map((f) => (
                <Card key={f.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <p className="font-semibold text-navy">{f.name}</p>
                    <Badge variant="success">
                      <Star className="mr-1 inline h-3 w-3" />
                      {f.rating?.toFixed(1) ?? "—"} ({f.ratingCount})
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Recent activity</h2>
            <div className="space-y-2">
              {insights.recentActivity.length === 0 ? (
                <p className="text-sm text-muted">No recent audit activity.</p>
              ) : (
                insights.recentActivity.map((a) => (
                  <Card key={a.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-navy">{a.action}</p>
                        <Badge>{a.entityType}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {a.user} · {formatDateTime(a.createdAt)}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>
        </>
      ) : (
        <p className="text-sm text-muted">Unable to load insights.</p>
      )}
    </div>
  );
}
