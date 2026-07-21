import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildSignUpUpdateForMissingFields, normalizeEmailVerificationCode } from "./clerk-sign-up.js";

describe("normalizeEmailVerificationCode", () => {
  it("strips non-digits", () => {
    assert.equal(normalizeEmailVerificationCode("661 144"), "661144");
    assert.equal(normalizeEmailVerificationCode("661-144"), "661144");
  });
});

describe("buildSignUpUpdateForMissingFields", () => {
  it("maps clerk missing field names", () => {
    const patch = buildSignUpUpdateForMissingFields(
      ["first_name", "last_name", "legal_accepted"],
      { firstName: "Ada", lastName: "Lovelace", legalAccepted: true }
    );
    assert.deepEqual(patch, {
      firstName: "Ada",
      lastName: "Lovelace",
      legalAccepted: true,
    });
  });
});
