"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { FacilityRecord } from "@/lib/api";

export default function FacilitiesPage() {
  const api = useApi();
  const [facilities, setFacilities] = useState<FacilityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await api.getFacilities({ limit: "50" });
        if (!cancelled) setFacilities(res.data ?? []);
      } catch {
        if (!cancelled) setFacilities([]);
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
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Facilities</h1>
          <p className="mt-1 text-sm text-muted">Healthcare facilities on the platform</p>
        </div>
        <Link
          href="/facilities/invite"
          className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white"
        >
          Invite manager
        </Link>
      </section>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : facilities.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No facilities found"
          description="Run db:seed to create demo facilities."
        />
      ) : (
        <div className="space-y-2">
          {facilities.map((f) => (
            <Card key={f.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-navy">{f.name}</p>
                  <p className="text-sm capitalize text-muted">{f.type.replace(/_/g, " ")}</p>
                  {f.locations?.[0] && (
                    <p className="mt-1 text-xs text-muted">
                      {f.locations[0].city}, {f.locations[0].state}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {f.rating != null && (
                    <Badge variant="success">
                      ★ {f.rating.toFixed(1)} ({f.ratingCount})
                    </Badge>
                  )}
                  <Badge variant={f.isActive ? "blue" : "default"}>
                    {f.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
