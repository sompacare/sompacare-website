import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateStaffingRoi,
  DEFAULT_STAFFING_INPUTS,
  formatCurrency,
  shiftsFromHours,
} from "./staffing-roi-calculator";

test("default inputs produce expected ESHYFT-style savings", () => {
  const result = calculateStaffingRoi(DEFAULT_STAFFING_INPUTS);

  assert.equal(result.totalLaborCost, 33_757);
  assert.equal(result.agencyMarkupCost, 5_064);
  assert.equal(result.platformTier, "GROWTH");
  assert.equal(result.platformFee, 1_500);
  assert.equal(result.monthlySavings, 3_564);
  assert.equal(result.annualSavings, 42_768);
});

test("shifts derive from hours at 8 hours per shift", () => {
  assert.equal(shiftsFromHours(225), 28.1);
  assert.equal(shiftsFromHours(540), 67.5);
});

test("zero inputs yield zero savings", () => {
  const result = calculateStaffingRoi({
    cna: { billRate: 0, monthlyHours: 0, monthlyShifts: 0 },
    lpn: { billRate: 0, monthlyHours: 0, monthlyShifts: 0 },
    rn: { billRate: 0, monthlyHours: 0, monthlyShifts: 0 },
  });
  assert.equal(result.totalLaborCost, 0);
  assert.equal(result.monthlySavings, 0);
  assert.equal(result.annualSavings, 0);
});

test("formatCurrency rounds to whole dollars", () => {
  assert.equal(formatCurrency(42750.4), "$42,750");
});
