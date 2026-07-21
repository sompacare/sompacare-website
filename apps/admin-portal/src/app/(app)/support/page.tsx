"use client";

import { useCallback, useEffect, useState } from "react";
import { LifeBuoy } from "lucide-react";
import { useApi, formatApiError } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import type { SupportTicket } from "@/lib/api";

function priorityVariant(priority: string) {
  if (priority === "URGENT") return "danger" as const;
  if (priority === "HIGH") return "warning" as const;
  return "default" as const;
}

export default function SupportPage() {
  const api = useApi();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.getSupportTickets({ limit: "50" });
      setTickets(res.data ?? []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  async function resolveTicket(id: string) {
    setUpdating(id);
    setError(null);
    try {
      await api.updateSupportTicket(id, { status: "RESOLVED" });
      await load();
    } catch (err) {
      setError(formatApiError(err, "Could not resolve ticket."));
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-navy">Support tickets</h1>
        <p className="mt-1 text-sm text-muted">Customer support queue</p>
      </section>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No tickets"
          description="Support tickets will appear here when users submit requests."
        />
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <Card key={t.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-navy">{t.subject}</p>
                    <p className="mt-1 text-sm text-muted">{t.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={priorityVariant(t.priority)}>{t.priority}</Badge>
                    <Badge variant={t.status === "OPEN" ? "warning" : "default"}>{t.status}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                  <span>
                    {t.user
                      ? `${t.user.firstName} ${t.user.lastName} · ${t.user.email}`
                      : "Unknown user"}
                    {" · "}
                    {formatDateTime(t.createdAt)}
                  </span>
                  {t.status !== "RESOLVED" && t.status !== "CLOSED" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={updating === t.id}
                      onClick={() => void resolveTicket(t.id)}
                    >
                      Mark resolved
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
