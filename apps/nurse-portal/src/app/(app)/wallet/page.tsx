"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, Banknote, Wallet as WalletIcon } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { formatApiError } from "@/lib/api";
import type { WalletInfo, WalletTransaction } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function WalletPage() {
  const api = useApi();
  const searchParams = useSearchParams();
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, tx] = await Promise.all([
        api.getWallet(),
        api.getWalletTransactions({ limit: "20" }),
      ]);
      setWallet(w);
      setTransactions(tx.data ?? []);
    } catch {
      setWallet(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const stripe = searchParams.get("stripe");
    if (stripe === "complete") {
      void api.syncStripeOnboard().then((res) => {
        if (res.stripeOnboarded) {
          setMessage("Payout setup complete. You can now use instant pay.");
        } else {
          setMessage("Stripe onboarding submitted — finish any remaining steps in Stripe.");
        }
        return load();
      }).catch((e) => {
        setMessage((e) => formatApiError(e, "Unable to finish payout setup."));
      });
    }
  }, [searchParams, api, load]);

  async function handleOnboard() {
    setActing(true);
    setMessage(null);
    try {
      const res = await api.startStripeOnboard();
      if (res.devBypass) {
        setMessage("Dev mode: payout setup marked complete.");
        await load();
      } else {
        window.location.href = res.url;
      }
    } catch (e) {
      setMessage(formatApiError(e, "Unable to start payout setup."));
    } finally {
      setActing(false);
    }
  }

  async function handleInstantPay() {
    if (!wallet || wallet.balance <= 0) return;
    setActing(true);
    setMessage(null);
    try {
      await api.instantPay(wallet.balance);
      setMessage("Instant payout sent.");
      await load();
    } catch (e) {
      setMessage(formatApiError(e, "Unable to start payout setup."));
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Wallet</h1>
        <p className="mt-1 text-sm text-muted">Earnings from approved shifts</p>
      </div>

      {message && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {message}
        </div>
      )}

      {loading ? (
        <Skeleton className="h-36 w-full" />
      ) : (
        <Card className="border-primary/20 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted">
              <WalletIcon className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold uppercase tracking-wide">Available balance</span>
            </div>
            <p className="mt-2 text-4xl font-bold text-navy">
              {formatCurrency(wallet?.balance ?? 0)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                variant="success"
                size="sm"
                onClick={handleInstantPay}
                disabled={acting || !wallet?.balance}
              >
                <Banknote className="h-4 w-4" />
                Instant pay
              </Button>
              <Button variant="secondary" size="sm" onClick={handleOnboard} disabled={acting}>
                Set up payouts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-navy">Transaction history</h2>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={WalletIcon}
            title="No transactions yet"
            description="Complete shifts and get timecards approved to earn."
            action={{ label: "View schedule", href: "/assignments" }}
          />
        ) : (
          transactions.map((tx) => {
            const isCredit = tx.amount > 0;
            return (
              <Card key={tx.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 rounded-full p-2 ${
                        isCredit ? "bg-green-100 text-success" : "bg-slate-100 text-muted"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-navy">
                        {tx.description ?? tx.type}
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${isCredit ? "text-success" : "text-navy"}`}>
                      {isCredit ? "+" : ""}
                      {formatCurrency(tx.amount)}
                    </p>
                    <Badge variant="default">{tx.type}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}
