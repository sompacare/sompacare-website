import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateShiftPay,
  calculateTimecardTotals,
  aggregateWorkerPay,
  aggregateWorkerPayFromSnapshots,
} from "./calculate";

describe("calculateShiftPay", () => {
  it("pays straight time for shifts under 8 hours", () => {
    const result = calculateShiftPay({ regularHours: 7.5, hourlyRate: 52 });
    assert.equal(result.regularHours, 7.5);
    assert.equal(result.overtimeHours, 0);
    assert.equal(result.grossPay, 390);
  });

  it("applies 1.5x for hours over 8", () => {
    const result = calculateShiftPay({ regularHours: 11.5, hourlyRate: 52 });
    assert.equal(result.regularHours, 8);
    assert.equal(result.overtimeHours, 3.5);
    assert.equal(result.grossPay, 689);
  });
});

describe("calculateTimecardTotals", () => {
  it("aligns pay and bill with the same OT split", () => {
    const totals = calculateTimecardTotals(11.5, 52, 65);
    assert.equal(totals.regularHours, 8);
    assert.equal(totals.overtimeHours, 3.5);
    assert.equal(totals.grossAmount, 689);
    assert.equal(totals.billAmount, 861.25);
  });
});

describe("aggregateWorkerPayFromSnapshots", () => {
  it("sums stored clock-out amounts without recalculating OT", () => {
    const result = aggregateWorkerPayFromSnapshots(
      [
        { regularHours: 8, overtimeHours: 3.5, grossAmount: 689 },
        { regularHours: 4, overtimeHours: 0, grossAmount: 200 },
      ],
      50
    );
    assert.equal(result.grossPay, 889);
    assert.equal(result.netPay, 839);
    assert.equal(result.overtimeHours, 3.5);
  });
});

describe("aggregateWorkerPay", () => {
  it("sums multiple shifts and applies deductions", () => {
    const result = aggregateWorkerPay(
      [
        { regularHours: 8, hourlyRate: 50 },
        { regularHours: 4, hourlyRate: 50 },
      ],
      25
    );
    assert.equal(result.grossPay, 600);
    assert.equal(result.netPay, 575);
  });
});

console.log("payroll calculate tests passed");
