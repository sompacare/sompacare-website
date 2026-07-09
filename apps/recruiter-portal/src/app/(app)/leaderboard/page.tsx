"use client";

import { useEffect, useState } from "react";
import { Medal, Trophy } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LeaderboardEntry } from "@/lib/api";

function rankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-amber-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
  return <span className="w-5 text-center text-sm font-bold text-muted">{rank}</span>;
}

export default function LeaderboardPage() {
  const api = useApi();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await api.getLeaderboard();
        if (!cancelled) setEntries(data);
      } catch {
        if (!cancelled) setEntries([]);
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
    <div className="space-y-5">
      <section>
        <h1 className="text-xl font-bold text-navy">Leaderboard</h1>
        <p className="text-sm text-muted">Top recruiters by placements</p>
      </section>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted">No placements recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <Card key={entry.recruiter?.id ?? entry.rank}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-8 w-8 items-center justify-center">{rankIcon(entry.rank)}</div>
                <div className="flex-1">
                  <p className="font-semibold text-navy">
                    {entry.recruiter
                      ? `${entry.recruiter.firstName} ${entry.recruiter.lastName}`
                      : "Unknown"}
                  </p>
                  <p className="text-xs text-muted">{entry.recruiter?.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{entry.placements}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted">placed</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
