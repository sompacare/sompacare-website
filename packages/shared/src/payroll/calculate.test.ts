import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateShiftPay, aggregateWorkerPay } from "./calculate";

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
