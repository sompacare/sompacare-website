"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Users } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import type { UserRecord } from "@/lib/api";

type ComplianceRisk = {
  type: string;
  severity: string;
  message: string;
};

export default function UsersPage() {
  const api = useApi();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskUserId, setRiskUserId] = useState<string | null>(null);
  const [risks, setRisks] = useState<ComplianceRisk[]>([]);
  const [riskMeta, setRiskMeta] = useState<{ score: number; isCompliant: boolean } | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [statusBusy, setStatusBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await api.getUsers({ limit: "50" });
        if (!cancelled) setUsers(res.data ?? []);
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  async function updateAccess(userId: string, status: "ACTIVE" | "INACTIVE") {
    setStatusBusy(userId);
    try {
      const res = await api.updateUserStatus(userId, status);
      setUsers((prev) =>
        prev.map((entry) => (entry.id === userId ? { ...entry, status: res.data.status } : entry))
      );
    } catch {
      // keep list unchanged on failure
    } finally {
      setStatusBusy(null);
    }
  }

  async function loadRisks(userId: string) {
    if (riskUserId === userId) {
      setRiskUserId(null);
      setRisks([]);
      setRiskMeta(null);
      return;
    }

    setRiskUserId(userId);
    setRiskLoading(true);
    try {
      const res = await api.getComplianceRisks(userId);
      setRisks(res.risks ?? []);
      setRiskMeta({ score: res.score, isCompliant: res.isCompliant });
    } catch {
      setRisks([]);
      setRiskMeta(null);
    } finally {
      setRiskLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-navy">Users</h1>
        <p className="mt-1 text-sm text-muted">Platform accounts, roles, and compliance risks</p>
      </section>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Seed the database or check API permissions."
        />
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-muted">{user.email}</p>
                    <p className="mt-1 text-xs text-muted">Joined {formatDate(user.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={user.status === "ACTIVE" ? "success" : "default"}>
                      {user.status}
                    </Badge>
                    {user.roles?.map((r) => (
                      <Badge key={r.role.name} variant="blue">
                        {r.role.displayName ?? r.role.name}
                      </Badge>
                    ))}
                    {user.profile?.clinicalRole && <Badge>{user.profile.clinicalRole}</Badge>}
                    <Button size="sm" variant="secondary" onClick={() => loadRisks(user.id)}>
                      <AlertTriangle className="h-4 w-4" />
                      {riskUserId === user.id ? "Hide risks" : "AI risks"}
                    </Button>
                    {user.status === "ACTIVE" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={statusBusy === user.id}
                        onClick={() => updateAccess(user.id, "INACTIVE")}
                      >
                        Terminate access
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={statusBusy === user.id}
                        onClick={() => updateAccess(user.id, "ACTIVE")}
                      >
                        Reactivate
                      </Button>
                    )}
                  </div>
                </div>

                {riskUserId === user.id && (
                  <div className="rounded-xl border border-border bg-slate-50 p-3">
                    {riskLoading ? (
                      <Skeleton className="h-16 w-full" />
                    ) : riskMeta ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={riskMeta.isCompliant ? "success" : "warning"}>
                            {riskMeta.isCompliant ? "Compliant" : "Non-compliant"}
                          </Badge>
                          <Badge variant="blue">Score {riskMeta.score}%</Badge>
                        </div>
                        {risks.length === 0 ? (
                          <p className="text-sm text-muted">No compliance risks detected.</p>
                        ) : (
                          risks.map((risk, index) => (
                            <div key={`${risk.type}-${index}`} className="rounded-lg bg-white p-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-navy">{risk.type}</p>
                                <Badge variant={risk.severity === "high" ? "danger" : "warning"}>
                                  {risk.severity}
                                </Badge>
                              </div>
                              <p className="mt-1 text-sm text-muted">{risk.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted">Unable to load compliance risks.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
