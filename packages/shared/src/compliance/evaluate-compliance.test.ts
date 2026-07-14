import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateCompliance } from "./evaluate-compliance";

const future = new Date("2027-01-01").toISOString();
const past = new Date("2024-01-01").toISOString();
const now = new Date("2026-06-01");

describe("evaluateCompliance", () => {
  it("passes when all credentials are valid", () => {
    const result = evaluateCompliance({
      now,
      licenses: [{ id: "1", type: "RN", status: "ACTIVE", expiresAt: future }],
      certifications: [
        { id: "c1", name: "BLS/CPR", status: "VERIFIED", expiresAt: future },
      ],
      backgroundChecks: [{ id: "b1", status: "VERIFIED", completedAt: future }],
    });

    assert.equal(result.isCompliant, true);
    assert.equal(result.blockedReasons.length, 0);
    assert.ok(result.score >= 90);
  });

  it("blocks expired license", () => {
    const result = evaluateCompliance({
      now,
      licenses: [{ id: "1", type: "RN", status: "ACTIVE", expiresAt: past }],
      certifications: [
        { id: "c1", name: "BLS/CPR", status: "VERIFIED", expiresAt: future },
      ],
      backgroundChecks: [{ id: "b1", status: "VERIFIED", completedAt: future }],
    });

    assert.equal(result.isCompliant, false);
    assert.ok(result.blockedReasons.some((r) => r.includes("license expired")));
  });

  it("blocks missing CPR certification", () => {
    const result = evaluateCompliance({
      now,
      licenses: [{ id: "1", type: "CNA", status: "ACTIVE", expiresAt: future }],
      certifications: [],
      backgroundChecks: [{ id: "b1", status: "VERIFIED", completedAt: future }],
    });

    assert.equal(result.isCompliant, false);
    assert.ok(result.blockedReasons.some((r) => r.includes("CPR")));
  });

  it("enforces required license type for shift", () => {
    const result = evaluateCompliance({
      now,
      requiredLicenseTypes: ["LPN"],
      licenses: [{ id: "1", type: "CNA", status: "ACTIVE", expiresAt: future }],
      certifications: [
        { id: "c1", name: "CPR", status: "VERIFIED", expiresAt: future },
      ],
      backgroundChecks: [{ id: "b1", status: "VERIFIED", completedAt: future }],
    });

    assert.equal(result.isCompliant, false);
    assert.ok(result.blockedReasons.some((r) => r.includes("LPN")));
  });

  it("allows placed workers to book while background check is pending", () => {
    const result = evaluateCompliance({
      now,
      placedBookingApproved: true,
      licenses: [{ id: "1", type: "RN", status: "PENDING_VERIFICATION", expiresAt: future }],
      certifications: [],
      backgroundChecks: [{ id: "b1", status: "PENDING", completedAt: null }],
    });

    assert.equal(result.isCompliant, true);
    assert.equal(result.blockedReasons.length, 0);
  });
});
