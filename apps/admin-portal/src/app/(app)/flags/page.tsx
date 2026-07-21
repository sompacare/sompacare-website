"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { useApi, formatApiError } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { FeatureFlag } from "@/lib/api";

export default function FlagsPage() {
  const api = useApi();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.getFeatureFlags();
      setFlags(data ?? []);
    } catch {
      setFlags([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleFlag(key: string, isEnabled: boolean) {
    setToggling(key);
    setError(null);
    try {
      await api.updateFeatureFlag(key, { isEnabled: !isEnabled });
      await load();
    } catch (err) {
      setError(formatApiError(err, "Could not update feature flag."));
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-navy">Feature flags</h1>
        <p className="mt-1 text-sm text-muted">Toggle platform features</p>
      </section>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : flags.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="No feature flags"
          description="Run db:seed to create default flags."
        />
      ) : (
        <div className="space-y-2">
          {flags.map((flag) => (
            <Card key={flag.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-navy">{flag.key}</p>
                  {flag.description && (
                    <p className="mt-1 text-sm text-muted">{flag.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={flag.isEnabled ? "success" : "default"}>
                    {flag.isEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant={flag.isEnabled ? "secondary" : "primary"}
                    disabled={toggling === flag.key}
                    onClick={() => void toggleFlag(flag.key, flag.isEnabled)}
                  >
                    {flag.isEnabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
