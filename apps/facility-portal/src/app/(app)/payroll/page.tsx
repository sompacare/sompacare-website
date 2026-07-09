"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check, Download, Play, Plus } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import type { PayRun } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "blue"> = {
  DRAFT: "default",
  PENDING_APPROVAL: "warning",
  APPROVED: "blue",
  PROCESSING: "blue",
  COMPLETED: "success",
  FAILED: "default",
};

export default function PayrollPage() {
  const api = useApi();
  const [runs, setRuns] = useState<PayRun[]>([]);
  const [anomalies, setAnomalies] = useState<
    Array<{ type: string; severity: string; message: string; workerName?: string }>
  >([]);
  const [anomalyBypass, setAnomalyBypass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [runRes, anomalyRes] = await Promise.all([
        api.getPayRuns({ limit: "20" }),
        api.getPayrollAnomalies().catch(() => ({ total: 0, anomalies: [], devBypass: true })),
      ]);
      setRuns(runRes.data ?? []);
      setAnomalies(anomalyRes.anomalies ?? []);
      setAnomalyBypass(anomalyRes.devBypass ?? false);
    } catch {
      setRuns([]);
      setAnomalies([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleGenerate() {
    setActingId("generate");
    try {
      await api.generatePayRun();
      await load();
    } finally {
      setActingId(null);
    }
  }

  async function handleApprove(id: string) {
    setActingId(id);
    try {
      await api.approvePayRun(id);
      await load();
    } finally {
      setActingId(null);
    }
  }

  async function handleProcess(id: string) {
    setActingId(id);
    try {
      await api.processPayRun(id);
      await load();
    } finally {
      setActingId(null);
    }
  }

  function handleExport(id: string) {
    api.exportPayRun(id).catch(() => undefined);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Payroll</h1>
          <p className="mt-1 text-sm text-muted">
            Generate pay runs from approved timecards, then process payouts
          </p>
        </div>
        <Button size="sm" onClick={handleGenerate} disabled={actingId === "generate"}>
          <Plus className="h-4 w-4" />
          {actingId === "generate" ? "Generating…" : "New run"}
        </Button>
      </div>

      {!loading && anomalies.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-bold text-navy">AI payroll alerts</h2>
              </div>
              {anomalyBypass && <Badge variant="default">Rules engine</Badge>}
            </div>
            <div className="space-y-2">
              {anomalies.slice(0, 5).map((item, index) => (
                <div key={`${item.type}-${index}`} className="rounded-xl border border-amber-100 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-navy">{item.workerName ?? "Timecard"}</p>
                    <Badge variant={item.severity === "high" ? "danger" : "warning"}>
                      {item.severity}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">{item.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <EmptyState
          title="No pay runs yet"
          description="Approve timecards first, then generate a pay run for the period."
          action={{ label: "Generate pay run", onClick: handleGenerate }}
        />
      ) : (
        <div className="space-y-3">
          {runs.map((run) => {
            const period = `${new Date(run.periodStart).toLocaleDateString()} – ${new Date(run.periodEnd).toLocaleDateString()}`;
            return (
              <Card key={run.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant={STATUS_VARIANT[run.status] ?? "default"}>
                        {run.status.replace("_", " ")}
                      </Badge>
                      <p className="mt-2 font-bold text-navy">{period}</p>
                      <p className="text-sm text-muted">
                        {run.workerCount} worker(s) · {run._count?.timecards ?? 0} timecard(s)
                      </p>
                    </div>
                    <p className="text-lg font-bold text-success">
                      {formatCurrency(Number(run.totalNet))}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {run.status === "PENDING_APPROVAL" && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleApprove(run.id)}
                        disabled={actingId === run.id}
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </Button>
                    )}
                    {run.status === "APPROVED" && (
                      <Button
                        size="sm"
                        onClick={() => handleProcess(run.id)}
                        disabled={actingId === run.id}
                      >
                        <Play className="h-4 w-4" />
                        Process payouts
                      </Button>
                    )}
                    <Button size="sm" variant="secondary" onClick={() => handleExport(run.id)}>
                      <Download className="h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
