"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus, RefreshCw } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { CandidateStage, PipelineResponse } from "@/lib/api";

const STAGES: { key: CandidateStage; label: string; color: string }[] = [
  { key: "APPLIED", label: "Applied", color: "bg-slate-100" },
  { key: "SCREENING", label: "Screening", color: "bg-blue-50" },
  { key: "INTERVIEW", label: "Interview", color: "bg-amber-50" },
  { key: "OFFER", label: "Offer", color: "bg-purple-50" },
  { key: "PLACED", label: "Placed", color: "bg-emerald-50" },
  { key: "HIRED", label: "Hired", color: "bg-green-100" },
];

export default function PipelinePage() {
  const api = useApi();
  const [pipeline, setPipeline] = useState<PipelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    clinicalRole: "RN",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getPipeline();
      setPipeline(data);
    } catch {
      setPipeline(null);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createCandidate(form);
      setForm({ firstName: "", lastName: "", email: "", clinicalRole: "RN" });
      setShowAdd(false);
      await load();
    } catch (err) {
      setError(formatApiError(err, "Could not add candidate."));
    } finally {
      setSaving(false);
    }
  }

  async function moveStage(id: string, stage: CandidateStage) {
    setError(null);
    try {
      await api.updateStage(id, stage);
      await load();
    } catch (err) {
      setError(formatApiError(err, "Could not update stage."));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy">Pipeline</h1>
          <p className="text-sm text-muted">
            {loading ? "Loading…" : `${pipeline?.total ?? 0} active candidates`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {showAdd && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
                <input
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </div>
              <input
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <select
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={form.clinicalRole}
                onChange={(e) => setForm({ ...form, clinicalRole: e.target.value })}
              >
                <option value="RN">RN</option>
                <option value="LPN">LPN</option>
                <option value="CNA">CNA</option>
                <option value="GNA">GNA</option>
                <option value="CMA">CMA</option>
                <option value="MED_TECH">Med Tech</option>
              </select>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Adding…" : "Add candidate"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
          {STAGES.map(({ key, label, color }) => {
            const column = pipeline?.columns.find((c) => c.stage === key);
            const candidates = column?.candidates ?? [];

            return (
              <div key={key} className="w-56 shrink-0">
                <div className={`mb-2 rounded-lg px-3 py-2 ${color}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-navy">{label}</span>
                    <Badge>{candidates.length}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  {candidates.map((c) => (
                    <Card key={c.id} className="border-border/80">
                      <CardContent className="space-y-2 p-3">
                        <Link href={`/candidates/${c.id}`} className="block">
                          <p className="font-semibold text-sm text-navy">
                            {c.firstName} {c.lastName}
                          </p>
                          <p className="text-xs text-muted">{c.clinicalRole}</p>
                          {c.source === "careers" && (
                            <p className="text-[10px] font-semibold uppercase text-primary">Careers</p>
                          )}
                          {c.matchScore != null && (
                            <p className="text-xs text-primary">Match {c.matchScore}%</p>
                          )}
                        </Link>
                        {key !== "PLACED" && key !== "HIRED" && (
                          <select
                            className="w-full rounded border border-border px-2 py-1 text-[11px]"
                            value={c.stage}
                            onChange={(e) => moveStage(c.id, e.target.value as CandidateStage)}
                          >
                            {STAGES.map((s) => (
                              <option key={s.key} value={s.key}>
                                → {s.label}
                              </option>
                            ))}
                            <option value="REJECTED">→ Rejected</option>
                          </select>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {candidates.length === 0 && (
                    <p className="px-1 text-xs text-muted">No candidates</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link
        href="/leaderboard"
        className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-navy"
      >
        View placement leaderboard
        <ChevronRight className="h-4 w-4 text-muted" />
      </Link>
    </div>
  );
}
