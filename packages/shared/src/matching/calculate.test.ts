import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateShiftMatch } from "./calculate";
import { detectPayrollAnomalies } from "./payroll-anomalies";
import { assessComplianceRisks } from "./compliance-risks";

describe("calculateShiftMatch", () => {
  it("scores a strong RN match highly", () => {
    const result = calculateShiftMatch(
      {
        role: "RN",
        hourlyRate: 52,
        shiftType: "PER_DIEM",
        requirements: ["Med-Surg", "BLS"],
        location: { city: "Baltimore", state: "MD" },
      },
      {
        clinicalRole: "RN",
        complianceScore: 98,
        reliabilityScore: 96,
        specialties: ["Medical-Surgical", "ICU"],
        minHourlyRate: 45,
        preferredShiftTypes: ["PER_DIEM"],
        preferredLocations: ["MD"],
      }
    );
    assert.ok(result.score >= 85);
    assert.ok(result.highlights.includes("Role match"));
  });

  it("scores role mismatch lower", () => {
    const result = calculateShiftMatch(
      {
        role: "RN",
        hourlyRate: 52,
        shiftType: "PER_DIEM",
        requirements: [],
        location: { city: "Baltimore", state: "MD" },
      },
      {
        clinicalRole: "CNA",
        complianceScore: 80,
        reliabilityScore: 80,
        specialties: [],
        preferredShiftTypes: [],
        preferredLocations: [],
      }
    );
    assert.ok(result.score < 60);
  });
});

describe("detectPayrollAnomalies", () => {
  it("flags missing clock-out", () => {
    const anomalies = detectPayrollAnomalies([
      {
        id: "tc1",
        workerId: "w1",
        regularHours: 8,
        overtimeHours: 0,
        breakMinutes: 30,
        scheduledHours: 8,
        hasClockOut: false,
        shiftEndTime: new Date(Date.now() - 7200000).toISOString(),
      },
    ]);
    assert.equal(anomalies[0]?.type, "missing_clock_out");
  });
});

describe("assessComplianceRisks", () => {
  it("flags expiring license", () => {
    const risks = assessComplianceRisks({
      score: 85,
      isCompliant: true,
      blockedReasons: [],
      licenses: [
        {
          id: "l1",
          type: "RN",
          status: "ACTIVE",
          expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(),
        },
      ],
      certifications: [],
    });
    assert.ok(risks.some((r) => r.type === "expiring_license"));
  });
});
