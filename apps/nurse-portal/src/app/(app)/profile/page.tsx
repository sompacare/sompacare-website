"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ShieldCheck, Star, Award } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import type { WorkerProfileResponse } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { user } = useUser();
  const api = useApi();
  const [profile, setProfile] = useState<WorkerProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await api.getMyProfile();
        if (!cancelled) setProfile(data);
      } catch {
        if (!cancelled) {
          setError(
            "Worker profile not found. Complete onboarding or contact support to link your account."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const displayName =
    profile?.user.firstName ?? user?.firstName ?? "Clinician";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Profile</h1>
        <p className="mt-1 text-sm text-muted">Your credentials and performance</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
              {displayName.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy">
                {profile?.user.firstName} {profile?.user.lastName}
              </h2>
              <p className="text-sm text-muted">{profile?.user.email ?? user?.primaryEmailAddress?.emailAddress}</p>
              {profile?.profile.clinicalRole && (
                <Badge className="mt-2" variant="blue">
                  {profile.profile.clinicalRole}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted">{error}</CardContent>
        </Card>
      ) : profile ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <ShieldCheck className="h-5 w-5 text-success" />
                <div>
                  <p className="text-xs text-muted">Compliance</p>
                  <p className="text-xl font-bold text-navy">{profile.profile.complianceScore}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Star className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted">Reliability</p>
                  <p className="text-xl font-bold text-navy">{profile.profile.reliabilityScore}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-navy">Compliance status</h3>
              </div>
              {profile.compliance.isCompliant ? (
                <p className="mt-3 text-sm text-success font-medium">
                  You&apos;re cleared to claim shifts
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {profile.compliance.blockedReasons.map((reason) => (
                    <li key={reason} className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      {reason}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {profile.profile.specialties.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="font-bold text-navy">Specialties</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.profile.specialties.map((s) => (
                    <Badge key={s}>{s}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
