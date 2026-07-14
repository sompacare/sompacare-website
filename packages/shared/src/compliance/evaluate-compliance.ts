export type ComplianceIssueType =
  | "LICENSE"
  | "CERTIFICATION"
  | "BACKGROUND_CHECK"
  | "DOCUMENT";

export type ComplianceIssue = {
  type: ComplianceIssueType;
  id: string;
  name: string;
  status: string;
  expiresAt?: string;
};

export type ComplianceEvaluationInput = {
  licenses: Array<{
    id: string;
    type: string;
    status: string;
    expiresAt: string;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    status: string;
    expiresAt?: string | null;
  }>;
  backgroundChecks: Array<{
    id: string;
    status: string;
    completedAt?: string | null;
  }>;
  requiredLicenseTypes?: string[];
  /** Recruiter/admin marked candidate PLACED — allow shift booking while verification is pending */
  placedBookingApproved?: boolean;
  now?: Date;
};

export type ComplianceEvaluation = {
  isCompliant: boolean;
  score: number;
  issues: ComplianceIssue[];
  blockedReasons: string[];
};

const REQUIRED_CERT_NAMES = ["CPR", "BLS"];

export function evaluateCompliance(input: ComplianceEvaluationInput): ComplianceEvaluation {
  const now = input.now ?? new Date();
  const issues: ComplianceIssue[] = [];
  const blockedReasons: string[] = [];
  const placed = input.placedBookingApproved === true;

  const activeLicenses = input.licenses.filter((l) => l.status === "ACTIVE");

  if (!placed && activeLicenses.length === 0) {
    blockedReasons.push("No active professional license on file");
  }

  for (const license of input.licenses) {
    const expiresAt = new Date(license.expiresAt);
    if (license.status === "EXPIRED" || expiresAt <= now) {
      issues.push({
        type: "LICENSE",
        id: license.id,
        name: license.type,
        status: "EXPIRED",
        expiresAt: license.expiresAt,
      });
      blockedReasons.push(`${license.type} license expired`);
    } else if (!placed && license.status !== "ACTIVE") {
      issues.push({
        type: "LICENSE",
        id: license.id,
        name: license.type,
        status: license.status,
        expiresAt: license.expiresAt,
      });
      blockedReasons.push(`${license.type} license is ${license.status.toLowerCase()}`);
    } else if (placed && (license.status === "REVOKED" || license.status === "REJECTED")) {
      issues.push({
        type: "LICENSE",
        id: license.id,
        name: license.type,
        status: license.status,
        expiresAt: license.expiresAt,
      });
      blockedReasons.push(`${license.type} license was ${license.status.toLowerCase()}`);
    }
  }

  if (!placed && input.requiredLicenseTypes?.length) {
    for (const required of input.requiredLicenseTypes) {
      const match = activeLicenses.find(
        (l) => l.type.toUpperCase() === required.toUpperCase() && new Date(l.expiresAt) > now
      );
      if (!match) {
        blockedReasons.push(`Missing required ${required} license`);
      }
    }
  }

  for (const cert of input.certifications) {
    if (cert.expiresAt) {
      const expiresAt = new Date(cert.expiresAt);
      if (expiresAt <= now || cert.status === "EXPIRED") {
        issues.push({
          type: "CERTIFICATION",
          id: cert.id,
          name: cert.name,
          status: "EXPIRED",
          expiresAt: cert.expiresAt,
        });
        blockedReasons.push(`${cert.name} certification expired`);
      }
    }
    if (cert.status === "REJECTED") {
      issues.push({
        type: "CERTIFICATION",
        id: cert.id,
        name: cert.name,
        status: cert.status,
        expiresAt: cert.expiresAt ?? undefined,
      });
      blockedReasons.push(`${cert.name} certification was rejected`);
    }
  }

  for (const requiredName of REQUIRED_CERT_NAMES) {
    if (placed) continue;
    const hasValid = input.certifications.some((c) => {
      const nameMatch = c.name.toUpperCase().includes(requiredName);
      const notExpired = !c.expiresAt || new Date(c.expiresAt) > now;
      const statusOk = c.status !== "REJECTED" && c.status !== "EXPIRED";
      return nameMatch && statusOk && notExpired;
    });
    if (!hasValid) {
      blockedReasons.push(`Missing valid ${requiredName} certification`);
    }
  }

  for (const check of input.backgroundChecks) {
    if (check.status === "REJECTED" || check.status === "EXPIRED") {
      issues.push({
        type: "BACKGROUND_CHECK",
        id: check.id,
        name: "Background Check",
        status: check.status,
      });
      blockedReasons.push("Background check did not pass");
    } else if (!placed && check.status !== "VERIFIED") {
      blockedReasons.push("Background check pending verification");
    }
  }

  const uniqueBlocked = [...new Set(blockedReasons)];
  const penalty = issues.length * 5 + uniqueBlocked.length * 10;
  const score = Math.max(0, 100 - penalty);

  return {
    isCompliant: uniqueBlocked.length === 0,
    score,
    issues,
    blockedReasons: uniqueBlocked,
  };
}
