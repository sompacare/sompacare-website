import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildWorkerSignupUrl,
  careerPositionToClinicalRole,
  clinicalRoleToPlatformRole,
} from "./funnel";

describe("careerPositionToClinicalRole", () => {
  it("maps careers positions to clinical roles", () => {
    assert.equal(careerPositionToClinicalRole("cna"), "CNA");
    assert.equal(careerPositionToClinicalRole("med-tech"), "MED_TECH");
    assert.equal(careerPositionToClinicalRole("RN"), "RN");
    assert.equal(careerPositionToClinicalRole("unknown"), "RN");
  });
});

describe("clinicalRoleToPlatformRole", () => {
  it("maps clinical roles to platform worker roles", () => {
    assert.equal(clinicalRoleToPlatformRole("GNA"), "GNA");
    assert.equal(clinicalRoleToPlatformRole("MED_TECH"), "MED_TECH");
  });
});

describe("buildWorkerSignupUrl", () => {
  it("builds nurse portal signup link with email", () => {
    const url = buildWorkerSignupUrl("https://nurse.example.com", "nurse@test.com");
    assert.equal(url, "https://nurse.example.com/sign-up?email=nurse%40test.com");
  });
});
