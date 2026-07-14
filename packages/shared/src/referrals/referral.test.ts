import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildCareersReferralUrl, buildReferralCode, normalizeReferralCode } from "./referral";

describe("buildReferralCode", () => {
  it("creates a stable short code", () => {
    const code = buildReferralCode("Sarah", "Johnson", "cmrct0uiq00iu1yz4");
    assert.match(code, /^SJOH-[A-Z0-9]{4}$/);
  });
});

describe("normalizeReferralCode", () => {
  it("uppercases and trims", () => {
    assert.equal(normalizeReferralCode(" sjoh-abc1 "), "SJOH-ABC1");
  });
});

describe("buildCareersReferralUrl", () => {
  it("builds careers page link with ref param", () => {
    const url = buildCareersReferralUrl("https://sompacare.com", "sjoh-abc1");
    assert.equal(url, "https://sompacare.com/careers?ref=SJOH-ABC1");
  });
});
