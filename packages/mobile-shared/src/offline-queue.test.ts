import test from "node:test";
import assert from "node:assert/strict";
import { OfflineClockQueue } from "./offline-queue";

test("OfflineClockQueue enqueues and flushes successfully", async () => {
  const store = new Map<string, string>();
  const storage = {
    getItem: async (key: string) => store.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      store.set(key, value);
    },
  };

  const queue = new OfflineClockQueue(storage);
  await queue.enqueue({
    assignmentId: "a1",
    type: "clock-in",
    coords: { latitude: 39.29, longitude: -76.61 },
  });

  const sent: string[] = [];
  const result = await queue.flush(async (item) => {
    sent.push(item.assignmentId);
  });

  assert.equal(result.synced, 1);
  assert.equal(result.remaining, 0);
  assert.deepEqual(sent, ["a1"]);
});

test("OfflineClockQueue keeps failed items", async () => {
  const store = new Map<string, string>();
  const storage = {
    getItem: async (key: string) => store.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      store.set(key, value);
    },
  };

  const queue = new OfflineClockQueue(storage);
  await queue.enqueue({
    assignmentId: "fail",
    type: "clock-out",
    coords: { latitude: 1, longitude: 2 },
  });

  const result = await queue.flush(async () => {
    throw new Error("offline");
  });

  assert.equal(result.synced, 0);
  assert.equal(result.remaining, 1);
  assert.equal((await queue.list()).length, 1);
});
