"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import type { VerificationCertification, VerificationLicense } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompliancePage() {
  const api = useApi();
  const [licenses, setLicenses] = useState<VerificationLicense[]>([]);
  const [certifications, setCertifications] = useState<VerificationCertification[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    try {
      const res = await api.getVerificationQueue();
      setLicenses(res.licenses ?? []);
      setCertifications(res.certifications ?? []);
    } catch (e) {
      const err = e as { status?: number };
      if (err.status === 403) setForbidden(true);
      setLicenses([]);
      setCertifications([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleVerify(
    type: "license" | "certification",
    id: string,
    action: "approve" | "reject"
  ) {
    setActingId(id);
    try {
      if (type === "license") {
        await api.verifyLicense(id, action);
      } else {
        await api.verifyCertification(id, action);
      }
      await load();
    } finally {
      setActingId(null);
    }
  }

  const total = licenses.length + certifications.length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Compliance queue</h1>
        <p className="mt-1 text-sm text-muted">
          Verify submitted licenses and certifications
        </p>
      </div>

      {forbidden ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted">
            Compliance verification requires a Compliance Officer or Admin account.
            Facility managers can view applicant compliance scores on the Applicants page.
          </CardContent>
        </Card>
      ) : loading ? (
        <Skeleton className="h-32 w-full" />
      ) : total === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Queue is clear"
          description="No licenses or certifications pending verification."
        />
      ) : (
        <div className="space-y-4">
          {licenses.map((lic) => (
            <Card key={lic.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-navy">
                      {lic.user.firstName} {lic.user.lastName}
                    </p>
                    <p className="text-xs text-muted">{lic.user.email}</p>
                    <p className="mt-2 font-medium">
                      {lic.type} — {lic.state} · {lic.number}
                    </p>
                    <p className="text-xs text-muted">
                      Expires {new Date(lic.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="warning">LICENSE</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={actingId === lic.id}
                    onClick={() => handleVerify("license", lic.id, "approve")}
                  >
                    <Check className="mr-1 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={actingId === lic.id}
                    onClick={() => handleVerify("license", lic.id, "reject")}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {certifications.map((cert) => (
            <Card key={cert.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-navy">
                      {cert.user.firstName} {cert.user.lastName}
                    </p>
                    <p className="text-xs text-muted">{cert.user.email}</p>
                    <p className="mt-2 font-medium">{cert.name}</p>
                    {cert.expiresAt && (
                      <p className="text-xs text-muted">
                        Expires {new Date(cert.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Badge variant="blue">CERT</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={actingId === cert.id}
                    onClick={() => handleVerify("certification", cert.id, "approve")}
                  >
                    <Check className="mr-1 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={actingId === cert.id}
                    onClick={() => handleVerify("certification", cert.id, "reject")}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
