"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Gift, Mail, Users } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

export default function ReferralsPage() {
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof api.getReferrals>> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.getReferrals());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  async function copyLink() {
    if (!data?.careersUrl) return;
    await navigator.clipboard.writeText(data.careersUrl);
    setMessage("Referral link copied.");
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      await api.inviteReferral(inviteEmail.trim());
      setInviteEmail("");
      setMessage("Invite sent.");
      await load();
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Referrals</h1>
        <p className="mt-1 text-sm text-muted">
          Invite clinicians and earn {formatCurrency(data?.bonusAmount ?? 50)} when they complete their first shift.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {message}
        </div>
      )}

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Card className="border-primary/20 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2 text-muted">
              <Gift className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold uppercase tracking-wide">Your referral code</span>
            </div>
            <p className="text-3xl font-bold tracking-wide text-navy">{data?.code ?? "—"}</p>
            {data?.careersUrl && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="secondary" size="sm" onClick={copyLink}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy careers link
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-3 p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
            <Mail className="h-4 w-4" />
            Invite by email
          </h2>
          <form onSubmit={sendInvite} className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@email.com"
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
              required
            />
            <Button type="submit" size="sm" disabled={busy}>
              Send
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
          <Users className="h-5 w-5" />
          Your referrals
        </h2>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : !data?.referrals?.length ? (
          <p className="text-sm text-muted">No referrals yet — share your link to get started.</p>
        ) : (
          data.referrals.map((ref) => (
            <Card key={ref.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold text-navy">{ref.refereeEmail}</p>
                  <p className="text-xs text-muted">{new Date(ref.createdAt).toLocaleDateString()}</p>
                </div>
                <Badge>{ref.status}</Badge>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
