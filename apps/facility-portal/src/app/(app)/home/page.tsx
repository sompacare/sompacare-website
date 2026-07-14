"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, Building2, ClipboardCheck, Inbox, Users } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useFacility } from "@/hooks/use-facility";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function HomePage() {
  const { user } = useUser();
  const api = useApi();
  const { facility, loading: facilityLoading, error: facilityError } = useFacility();
  const [pendingApps, setPendingApps] = useState(0);
  const [publishedShifts, setPublishedShifts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!facility?.id) return;
    let cancelled = false;

    async function load() {
      try {
        const [apps, shifts] = await Promise.all([
          api.getApplications({ facilityId: facility!.id, status: "PENDING", limit: "50" }),
          api.getShifts({ facilityId: facility!.id, status: "PUBLISHED", limit: "50" }),
        ]);
        if (!cancelled) {
          setPendingApps(apps.data?.length ?? 0);
          setPublishedShifts(shifts.data?.length ?? 0);
        }
      } catch {
        if (!cancelled) {
          setPendingApps(0);
          setPublishedShifts(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [api, facility]);

  const firstName = user?.firstName ?? "there";

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-muted">Welcome back,</p>
        <h1 className="text-2xl font-bold text-navy">{firstName} 👋</h1>
        {facility && (
          <p className="mt-1 text-sm text-muted">{facility.name}</p>
        )}
      </section>

      {facilityError && (
        <div className="space-y-3">
          <EmptyState
            icon={Building2}
            title="Finish facility setup"
            description="Complete onboarding to link your organization and start posting shifts."
          />
          <Link
            href="/onboarding"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white"
          >
            Continue setup
          </Link>
        </div>
      )}

      {!facilityLoading && !facilityError && !loading && pendingApps === 0 && publishedShifts === 0 && (
        <EmptyState
          icon={Inbox}
          title="You're all caught up"
          description="Post a shift to the marketplace to start receiving clinician applications."
          action={{ label: "Post a shift", href: "/shifts/new" }}
        />
      )}

      <section className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted">
              <Users className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Pending</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-navy">
              {loading || facilityLoading ? "—" : pendingApps}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted">
              <Building2 className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Live shifts</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-navy">
              {loading || facilityLoading ? "—" : publishedShifts}
            </p>
          </CardContent>
        </Card>
      </section>

      {pendingApps > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 text-amber-700" />
              <div>
                <p className="font-semibold text-navy">{pendingApps} applicant(s) waiting</p>
                <p className="text-sm text-muted">Review and approve staff for open shifts</p>
              </div>
            </div>
            <Link href="/applications">
              <Button size="sm">Review</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-navy">Quick actions</h2>
        <Link href="/shifts/new">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-navy">Post a new shift</p>
                <p className="text-sm text-muted">Create and publish to the marketplace</p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/applications">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-navy">Review applications</p>
                <p className="text-sm text-muted">Approve or reject clinician applicants</p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>
        </Link>
      </section>

      {facilityLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}
    </div>
  );
}
