"use client";

import { useCallback, useEffect, useState } from "react";
import { Briefcase, Globe, PauseCircle } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { JobPosting } from "@/lib/api";

export default function JobPostingsPage() {
  const api = useApi();
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getJobPostings();
      setPostings(res.data ?? []);
    } catch {
      setPostings([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(posting: JobPosting, status: string) {
    setBusy(posting.slug);
    setError(null);
    try {
      await api.updateJobPosting(posting.slug, { status });
      await load();
    } catch (err) {
      setError(formatApiError(err, "Could not update job posting."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-navy">Job postings</h1>
        <p className="text-sm text-muted">Manage roles shown on the public careers page.</p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : postings.length === 0 ? (
        <p className="text-sm text-muted">No postings yet. Run database seed to import default roles.</p>
      ) : (
        <div className="space-y-3">
          {postings.map((posting) => (
            <Card key={posting.slug}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy">{posting.title}</p>
                    <p className="text-xs text-muted">{posting.category} · {posting.clinicalRole}</p>
                  </div>
                  <Badge>{posting.status}</Badge>
                </div>
                <p className="line-clamp-2 text-sm text-muted">{posting.description}</p>
                <div className="flex flex-wrap gap-2">
                  {posting.status !== "PUBLISHED" && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy === posting.slug}
                      onClick={() => void setStatus(posting, "PUBLISHED")}
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      Publish
                    </Button>
                  )}
                  {posting.status === "PUBLISHED" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={busy === posting.slug}
                      onClick={() => void setStatus(posting, "CLOSED")}
                    >
                      <PauseCircle className="mr-2 h-4 w-4" />
                      Close
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="flex items-center gap-3 p-4 text-sm text-muted">
          <Briefcase className="h-5 w-5 shrink-0 text-primary" />
          Published roles sync to sompacare.com/careers automatically.
        </CardContent>
      </Card>
    </div>
  );
}
