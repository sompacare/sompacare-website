"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Clock, MapPin, Sparkles, X } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import type { Application, Shift } from "@/lib/api";
import { formatCurrency, formatShiftTime, statusBadgeVariant } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShiftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const [shift, setShift] = useState<Shift | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [aiMatches, setAiMatches] = useState<
    Array<{
      worker: { id: string; firstName: string; lastName: string; email: string };
      score: number;
      highlights: string[];
      summary: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [shiftRes, appsRes, matchesRes] = await Promise.all([
        api.getShift(id),
        api.getApplications({ shiftId: id, limit: "50" }),
        api.getShiftMatches(id).catch(() => ({ matches: [] })),
      ]);
      setShift(shiftRes);
      setApplications(appsRes.data ?? []);
      setAiMatches(matchesRes.matches ?? []);
    } catch {
      setShift(null);
      setApplications([]);
      setError("Could not load this shift.");
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(appId: string) {
    setActingId(appId);
    try {
      await api.approveApplication(appId);
      await load();
    } finally {
      setActingId(null);
    }
  }

  async function handleReject(appId: string) {
    setActingId(appId);
    try {
      await api.rejectApplication(appId, "Not selected for this shift");
      await load();
    } finally {
      setActingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!shift) {
    return (
      <EmptyState
        title="Shift not found"
        description={error ?? "This shift may have been removed."}
        action={{ label: "Back to shifts", href: "/shifts" }}
      />
    );
  }

  const { date, time } = formatShiftTime(shift.startTime, shift.endTime);
  const pending = applications.filter((a) => a.status === "PENDING");
  const reviewed = applications.filter((a) => a.status !== "PENDING");

  return (
    <div className="space-y-5">
      <Link
        href="/shifts"
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to shifts
      </Link>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="blue">{shift.role}</Badge>
            <Badge variant={statusBadgeVariant(shift.status)}>{shift.status}</Badge>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-navy">{shift.title}</h1>
          <p className="mt-1 text-lg font-bold text-success">
            {formatCurrency(Number(shift.billRate ?? shift.hourlyRate))}
            <span className="text-sm font-medium text-muted">/hr bill</span>
          </p>
          <p className="text-sm text-muted">
            Clinician pay {formatCurrency(Number(shift.payRate ?? shift.hourlyRate))}/hr
          </p>
          <div className="mt-4 space-y-2 text-sm text-muted">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {date} · {time}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {shift.location.city}, {shift.location.state}
            </div>
            <p>
              {shift.slotsFilled}/{shift.slotsTotal} filled · {applications.length} applicant(s)
            </p>
          </div>
          {shift.status === "DRAFT" && (
            <Link href="/shifts">
              <Button className="mt-4 w-full">Publish from shifts list</Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {aiMatches.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-navy">AI-ranked matches</h2>
          </div>
          {aiMatches.slice(0, 5).map((match) => (
            <Card key={match.worker.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-navy">
                      {match.worker.firstName} {match.worker.lastName}
                    </p>
                    <p className="text-sm text-muted">{match.worker.email}</p>
                  </div>
                  <Badge variant="success">{match.score}% match</Badge>
                </div>
                <p className="mt-2 text-sm text-muted">{match.summary}</p>
                {match.highlights.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {match.highlights.map((h) => (
                      <Badge key={h}>{h}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-navy">Pending applicants</h2>
        {pending.length === 0 ? (
          <EmptyState
            title="No pending applicants"
            description="Clinicians who apply to this shift will appear here."
          />
        ) : (
          pending.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-navy">
                      {app.applicant.firstName} {app.applicant.lastName}
                    </p>
                    <p className="text-sm text-muted">{app.applicant.email}</p>
                  </div>
                  {(app.matchScore ?? app.applicant.profile?.complianceScore) != null && (
                    <Badge variant="success">
                      {app.matchScore ?? app.applicant.profile?.complianceScore}% match
                    </Badge>
                  )}
                </div>
                {app.message && (
                  <p className="mt-2 text-sm text-muted">&ldquo;{app.message}&rdquo;</p>
                )}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleApprove(app.id)}
                    disabled={actingId === app.id}
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleReject(app.id)}
                    disabled={actingId === app.id}
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      {reviewed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-navy">Reviewed</h2>
          {reviewed.map((app) => (
            <Card key={app.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold text-navy">
                    {app.applicant.firstName} {app.applicant.lastName}
                  </p>
                  <p className="text-sm text-muted">{app.applicant.email}</p>
                </div>
                <Badge variant={statusBadgeVariant(app.status)}>{app.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
