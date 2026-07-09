"use client";

import { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import type { AuditLog } from "@/lib/api";

export default function AuditPage() {
  const api = useApi();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await api.getAuditLogs({ limit: "50" });
        if (!cancelled) setLogs(res.data ?? []);
      } catch {
        if (!cancelled) setLogs([]);
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
        <h1 className="text-2xl font-bold text-navy">Audit logs</h1>
        <p className="mt-1 text-sm text-muted">Platform activity trail</p>
      </section>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit entries"
          description="Actions across the platform are recorded here."
        />
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-navy">{log.action}</p>
                  <p className="text-sm text-muted">
                    {log.entityType}
                    {log.entityId ? ` · ${log.entityId.slice(0, 12)}…` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {log.user
                      ? `${log.user.firstName} ${log.user.lastName}`
                      : "System"}{" "}
                    · {formatDateTime(log.createdAt)}
                  </p>
                </div>
                <Badge>{log.entityType}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
