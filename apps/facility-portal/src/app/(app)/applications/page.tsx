"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useFacility } from "@/hooks/use-facility";
import type { Application } from "@/lib/api";
import { formatShiftTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ApplicationsPage() {
  const api = useApi();
  const { facility, loading: facilityLoading } = useFacility();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!facility?.id) return;
    setLoading(true);
    try {
      const res = await api.getApplications({
        facilityId: facility.id,
        status: "PENDING",
        limit: "50",
      });
      setApplications(res.data ?? []);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [api, facility?.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(id: string) {
    setActingId(id);
    try {
      await api.approveApplication(id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setActingId(null);
    }
  }

  async function handleReject(id: string) {
    setActingId(id);
    try {
      await api.rejectApplication(id, "Not selected for this shift");
      setApplications((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Applicants</h1>
        <p className="mt-1 text-sm text-muted">Review and approve clinician applications</p>
      </div>

      {facilityLoading || loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="font-semibold text-navy">No pending applications</p>
            <p className="mt-2 text-sm text-muted">
              When clinicians apply to your shifts, they&apos;ll appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const { date, time } = formatShiftTime(
              app.shift.startTime,
              app.shift.endTime
            );
            const score = app.applicant.profile?.complianceScore ?? app.matchScore;
            return (
              <Card key={app.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-navy">
                        {app.applicant.firstName} {app.applicant.lastName}
                      </p>
                      <p className="text-sm text-muted">{app.applicant.email}</p>
                    </div>
                    {score != null && (
                      <Badge variant="success">{score}% match</Badge>
                    )}
                  </div>

                  <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                    <Link
                      href={`/shifts/${app.shift.id}`}
                      className="font-semibold text-navy hover:text-primary"
                    >
                      {app.shift.title}
                    </Link>
                    <p className="text-muted">{date} · {time}</p>
                    {app.message && (
                      <p className="mt-2 text-muted">&ldquo;{app.message}&rdquo;</p>
                    )}
                  </div>

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
            );
          })}
        </div>
      )}
    </div>
  );
}
