import { test } from "node:test";
import assert from "node:assert/strict";
import { getUnpaidTimecardBlockers } from "./payout-gate";

test("returns empty when all invoices are paid", () => {
  const blockers = getUnpaidTimecardBlockers([
    {
      id: "tc_abc123",
      shiftTitle: "RN — Med-Surg",
      invoiceId: "inv_1",
      invoiceStatus: "PAID",
      invoiceNumber: "INV-001",
    },
  ]);
  assert.deepEqual(blockers, []);
});

test("blocks timecards with no invoice", () => {
  const blockers = getUnpaidTimecardBlockers([
    {
      id: "tc_abc123",
      shiftTitle: "RN — Med-Surg",
      invoiceId: null,
      invoiceStatus: null,
      invoiceNumber: null,
    },
  ]);
  assert.equal(blockers.length, 1);
  assert.match(blockers[0], /no invoice/);
});

test("blocks timecards with unpaid invoices", () => {
  const blockers = getUnpaidTimecardBlockers([
    {
      id: "tc_def456",
      shiftTitle: "LPN — ICU",
      invoiceId: "inv_2",
      invoiceStatus: "SENT",
      invoiceNumber: "INV-002",
    },
  ]);
  assert.equal(blockers.length, 1);
  assert.match(blockers[0], /INV-002/);
  assert.match(blockers[0], /SENT/);
});

test("reports multiple blockers", () => {
  const blockers = getUnpaidTimecardBlockers([
    {
      id: "tc_one",
      shiftTitle: "Shift A",
      invoiceId: null,
      invoiceStatus: null,
      invoiceNumber: null,
    },
    {
      id: "tc_two",
      shiftTitle: "Shift B",
      invoiceId: "inv_x",
      invoiceStatus: "SENT",
      invoiceNumber: "INV-X",
    },
  ]);
  assert.equal(blockers.length, 2);
});
