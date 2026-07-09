import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { daysUntilExpiry, getExpirySeverity, reminderThreshold } from "./expiry";

describe("expiry helpers", () => {
  const now = new Date("2026-07-01");

  it("computes days until expiry", () => {
    const expires = new Date("2026-07-15");
    assert.equal(daysUntilExpiry(expires, now), 14);
  });

  it("returns critical severity within 7 days", () => {
    const expires = new Date("2026-07-05");
    assert.equal(getExpirySeverity(expires, now), "critical");
  });

  it("returns reminder threshold for 14 days", () => {
    const expires = new Date("2026-07-15");
    assert.equal(reminderThreshold(daysUntilExpiry(expires, now)), 14);
  });

  it("returns null when more than 30 days out", () => {
    const expires = new Date("2026-08-15");
    assert.equal(reminderThreshold(daysUntilExpiry(expires, now)), null);
  });
});
