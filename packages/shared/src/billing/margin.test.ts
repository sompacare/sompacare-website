import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateBillRate,
  calculatePlatformMargin,
  calculateTimecardAmounts,
  resolveShiftRates,
} from "./margin";

test("RN bill rate uses ~25% markup", () => {
  const bill = calculateBillRate(40, "RN");
  assert.equal(bill, 50);
});

test("CNA bill rate uses ~30% markup with minimum spread", () => {
  const bill = calculateBillRate(18, "CNA");
  assert.equal(bill, 23.4);
});

test("low pay rate enforces minimum hourly spread", () => {
  const bill = calculateBillRate(10, "CNA");
  assert.equal(bill, 14);
});

test("resolveShiftRates allows explicit bill rate override", () => {
  const rates = resolveShiftRates({ payRate: 40, role: "RN", billRate: 55 });
  assert.equal(rates.billRate, 55);
  assert.equal(rates.hourlySpread, 15);
});

test("timecard amounts separate pay and bill", () => {
  const amounts = calculateTimecardAmounts(8, 40, 50);
  assert.equal(amounts.payAmount, 320);
  assert.equal(amounts.billAmount, 400);
});

test("platform margin per 8h RN shift", () => {
  assert.equal(calculatePlatformMargin(8, 40, 50), 80);
});
