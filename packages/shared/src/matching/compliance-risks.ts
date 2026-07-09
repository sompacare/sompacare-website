export type ComplianceRisk = {
  type: "expiring_license" | "expiring_cert" | "pending_verification" | "background_check" | "low_score";
  severity: "low" | "medium" | "high";
  message: string;
  entityType: string;
  entityId?: string;
  daysUntilExpiry?: number;
};

export type ComplianceRiskInput = {
  score: number;
  isCompliant: boolean;
  blockedReasons: string[];
  licenses: Array<{ id: string; type: string; status: string; expiresAt: string }>;
  certifications: Array<{ id: string; name: string; status: string; expiresAt?: string | null }>;
  backgroundCheckStatus?: string | null;
};

export function assessComplianceRisks(input: ComplianceRiskInput): ComplianceRisk[] {
  const risks: ComplianceRisk[] = [];
  const now = Date.now();

  if (input.score < 70) {
    risks.push({
      type: "low_score",
      severity: input.score < 50 ? "high" : "medium",
      message: `Compliance score is ${input.score}%`,
      entityType: "worker",
    });
  }

  for (const lic of input.licenses) {
    const days = Math.ceil((new Date(lic.expiresAt).getTime() - now) / 86400000);
    if (lic.status === "PENDING" || lic.status === "PENDING_VERIFICATION") {
      risks.push({
        type: "pending_verification",
        severity: "medium",
        message: `${lic.type} license pending verification`,
        entityType: "license",
        entityId: lic.id,
      });
    }
    if (days <= 30 && days > 0) {
      risks.push({
        type: "expiring_license",
        severity: days <= 7 ? "high" : "medium",
        message: `${lic.type} license expires in ${days} days`,
        entityType: "license",
        entityId: lic.id,
        daysUntilExpiry: days,
      });
    }
  }

  for (const cert of input.certifications) {
    if (!cert.expiresAt) continue;
    const days = Math.ceil((new Date(cert.expiresAt).getTime() - now) / 86400000);
    if (days <= 30 && days > 0) {
      risks.push({
        type: "expiring_cert",
        severity: days <= 7 ? "high" : "low",
        message: `${cert.name} expires in ${days} days`,
        entityType: "certification",
        entityId: cert.id,
        daysUntilExpiry: days,
      });
    }
  }

  if (input.backgroundCheckStatus && input.backgroundCheckStatus !== "VERIFIED") {
    risks.push({
      type: "background_check",
      severity: "high",
      message: `Background check status: ${input.backgroundCheckStatus}`,
      entityType: "background_check",
    });
  }

  for (const reason of input.blockedReasons) {
    risks.push({
      type: "low_score",
      severity: "high",
      message: reason,
      entityType: "compliance",
    });
  }

  return risks.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.severity] - rank[b.severity];
  });
}
