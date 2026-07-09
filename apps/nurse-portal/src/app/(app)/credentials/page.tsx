"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, FileBadge, Plus, ShieldCheck } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import type { Certification, ComplianceAlert, License } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "blue"> = {
  ACTIVE: "success",
  VERIFIED: "success",
  PENDING: "warning",
  PENDING_VERIFICATION: "warning",
  EXPIRED: "default",
  REJECTED: "default",
  REVOKED: "default",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CredentialsPage() {
  const api = useApi();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLicenseForm, setShowLicenseForm] = useState(false);
  const [showCertForm, setShowCertForm] = useState(false);
  const [acting, setActing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [licRes, certRes, alertRes, complianceRes] = await Promise.all([
        api.getLicenses(),
        api.getCertifications(),
        api.getComplianceAlerts(),
        api.getCompliance(),
      ]);
      setLicenses(licRes.data ?? []);
      setCertifications(certRes.data ?? []);
      setAlerts(alertRes.data ?? []);
      setScore(complianceRes.data?.score ?? null);
    } catch {
      setLicenses([]);
      setCertifications([]);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmitLicense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setActing(true);
    setMessage(null);
    try {
      await api.submitLicense({
        type: String(form.get("type")),
        number: String(form.get("number")),
        state: String(form.get("state")),
        expiresAt: new Date(String(form.get("expiresAt"))).toISOString(),
        documentUrl: String(form.get("documentUrl") || "") || undefined,
      });
      setShowLicenseForm(false);
      setMessage("License submitted for verification.");
      await load();
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setActing(false);
    }
  }

  async function handleSubmitCert(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setActing(true);
    setMessage(null);
    try {
      const expires = form.get("expiresAt");
      await api.submitCertification({
        name: String(form.get("name")),
        issuer: String(form.get("issuer") || "") || undefined,
        expiresAt: expires ? new Date(String(expires)).toISOString() : undefined,
        documentUrl: String(form.get("documentUrl") || "") || undefined,
      });
      setShowCertForm(false);
      setMessage("Certification submitted for verification.");
      await load();
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Credentials</h1>
        <p className="mt-1 text-sm text-muted">
          Licenses, certifications, and compliance status
        </p>
      </div>

      {score != null && (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ShieldCheck className="h-6 w-6 text-success" />
            <div>
              <p className="text-xs text-muted">Compliance score</p>
              <p className="text-2xl font-bold text-navy">{score}%</p>
            </div>
          </CardContent>
        </Card>
      )}

      {message && (
        <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p>
      )}

      {alerts.length > 0 && (
        <Card>
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h2 className="font-bold text-navy">Alerts</h2>
            </div>
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900"
              >
                {alert.message}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-navy">Licenses</h2>
          <Button size="sm" variant="outline" onClick={() => setShowLicenseForm((v) => !v)}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>

        {showLicenseForm && (
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleSubmitLicense} className="space-y-3">
                <input
                  name="type"
                  placeholder="Type (RN, LPN, CNA)"
                  required
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                <input
                  name="number"
                  placeholder="License number"
                  required
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                <input
                  name="state"
                  placeholder="State (MD)"
                  required
                  maxLength={2}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                <input
                  name="expiresAt"
                  type="date"
                  required
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                <input
                  name="documentUrl"
                  placeholder="Document URL (optional)"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                <Button type="submit" disabled={acting} className="w-full">
                  Submit for verification
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Skeleton className="h-20 w-full" />
        ) : licenses.length === 0 ? (
          <EmptyState
            icon={FileBadge}
            title="No licenses on file"
            description="Add your professional license to claim shifts."
          />
        ) : (
          licenses.map((lic) => (
            <Card key={lic.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold text-navy">
                    {lic.type} — {lic.state}
                  </p>
                  <p className="text-xs text-muted">{lic.number}</p>
                  <p className="text-xs text-muted">Expires {formatDate(lic.expiresAt)}</p>
                </div>
                <Badge variant={STATUS_VARIANT[lic.status] ?? "default"}>{lic.status}</Badge>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-navy">Certifications</h2>
          <Button size="sm" variant="outline" onClick={() => setShowCertForm((v) => !v)}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>

        {showCertForm && (
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleSubmitCert} className="space-y-3">
                <input
                  name="name"
                  placeholder="Name (BLS/CPR)"
                  required
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                <input
                  name="issuer"
                  placeholder="Issuer (optional)"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                <input
                  name="expiresAt"
                  type="date"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                <input
                  name="documentUrl"
                  placeholder="Document URL (optional)"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                <Button type="submit" disabled={acting} className="w-full">
                  Submit for verification
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Skeleton className="h-20 w-full" />
        ) : certifications.length === 0 ? (
          <EmptyState
            icon={FileBadge}
            title="No certifications"
            description="Upload BLS/CPR and other required certifications."
          />
        ) : (
          certifications.map((cert) => (
            <Card key={cert.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold text-navy">{cert.name}</p>
                  {cert.issuer && <p className="text-xs text-muted">{cert.issuer}</p>}
                  {cert.expiresAt && (
                    <p className="text-xs text-muted">Expires {formatDate(cert.expiresAt)}</p>
                  )}
                </div>
                <Badge variant={STATUS_VARIANT[cert.status] ?? "default"}>{cert.status}</Badge>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <p className="text-center text-sm text-muted">
        <Link href="/profile" className="text-primary font-semibold">
          Back to profile
        </Link>
      </p>
    </div>
  );
}
