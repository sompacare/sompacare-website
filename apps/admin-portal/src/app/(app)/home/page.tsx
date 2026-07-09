"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  DollarSign,
  LifeBuoy,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { DashboardResponse } from "@/lib/api";

function KpiCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted">
          <Icon className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
        </div>
        <p className="mt-2 text-2xl font-bold text-navy">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const api = useApi();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await api.getDashboard();
        if (!cancelled) setDashboard(data);
      } catch {
        if (!cancelled) setDashboard(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const kpis = dashboard?.kpis;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-navy">Platform dashboard</h1>
        <p className="mt-1 text-sm text-muted">KPIs for the last 30 days</p>
      </section>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : kpis ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard label="Active users" value={kpis.totalUsers} icon={Users} sub={`${kpis.activeWorkers} workers`} />
          <KpiCard label="Facilities" value={kpis.totalFacilities} icon={Building2} />
          <KpiCard
            label="Fill rate"
            value={`${kpis.fillRate}%`}
            icon={TrendingUp}
            sub={`${kpis.publishedShifts} published shifts`}
          />
          <KpiCard
            label="Revenue (30d)"
            value={formatCurrency(kpis.revenue30d)}
            icon={DollarSign}
            sub={`${kpis.paidInvoices30d} invoices paid`}
          />
          <KpiCard
            label="Payroll (30d)"
            value={formatCurrency(kpis.payrollProcessed30d)}
            icon={DollarSign}
            sub={`${kpis.payRuns30d} pay runs`}
          />
          <KpiCard label="Open tickets" value={kpis.openTickets} icon={LifeBuoy} />
          <KpiCard label="Compliance queue" value={kpis.pendingCompliance} icon={ShieldAlert} />
          <KpiCard label="Placements" value={kpis.placementsTotal} icon={Users} />
        </section>
      ) : (
        <p className="text-sm text-muted">Unable to load dashboard. Is the API running?</p>
      )}

      <section className="flex flex-wrap gap-2">
        <Link href="/support">
          <Badge variant="blue">Support tickets</Badge>
        </Link>
        <Link href="/audit">
          <Badge>Audit logs</Badge>
        </Link>
        <Link href="/flags">
          <Badge>Feature flags</Badge>
        </Link>
        <Link href="/insights">
          <Badge variant="success">AI insights</Badge>
        </Link>
      </section>
    </div>
  );
}
