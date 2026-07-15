"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROLE_STANDARD_RATES } from "@sompacare/shared";
import { useApi } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const ROLES = Object.keys(ROLE_STANDARD_RATES);

type RateRow = { payRate: string; billRate: string };

export default function RatesPage() {
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rates, setRates] = useState<Record<string, RateRow>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.getRoleRates();
        const rows: Record<string, RateRow> = {};
        for (const role of ROLES) {
          const r = res.data[role] ?? ROLE_STANDARD_RATES[role as keyof typeof ROLE_STANDARD_RATES];
          rows[role] = {
            payRate: String(r.payRate),
            billRate: String(r.billRate),
          };
        }
        setRates(rows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load rates.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [api]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: Record<string, { payRate: number; billRate: number }> = {};
      for (const [role, row] of Object.entries(rates)) {
        const payRate = Number(row.payRate);
        const billRate = Number(row.billRate);
        if (!Number.isFinite(payRate) || !Number.isFinite(billRate) || billRate < payRate) {
          throw new Error(`${role}: bill rate must be at or above pay rate.`);
        }
        payload[role] = { payRate, billRate };
      }
      await api.updateRoleRates(payload);
      setSuccess("Rates saved. Open published shifts now reflect these defaults.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save rates.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Link href="/home" className="text-sm font-semibold text-primary hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-navy">Role rates</h1>
        <p className="mt-1 text-sm text-muted">
          Command-center pay and bill rates. Facilities and nurses see the appropriate side only;
          updating here also refreshes open published shifts.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr] text-xs font-semibold uppercase tracking-wide text-muted">
              <span>Role</span>
              <span>Pay ($/hr)</span>
              <span>Bill ($/hr)</span>
            </div>
            {ROLES.map((role) => (
              <div key={role} className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr] items-center">
                <Label className="font-semibold text-navy">
                  {role === "MED_TECH" ? "Med Tech" : role}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={rates[role]?.payRate ?? ""}
                  onChange={(e) =>
                    setRates((prev) => ({
                      ...prev,
                      [role]: { ...prev[role], payRate: e.target.value },
                    }))
                  }
                  required
                />
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={rates[role]?.billRate ?? ""}
                  onChange={(e) =>
                    setRates((prev) => ({
                      ...prev,
                      [role]: { ...prev[role], billRate: e.target.value },
                    }))
                  }
                  required
                />
              </div>
            ))}

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            {success && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {success}
              </p>
            )}

            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save platform rates"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
