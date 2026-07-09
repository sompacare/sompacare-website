import type { ClockCoords } from "./types";

export type ClockQueueItem = {
  id: string;
  assignmentId: string;
  type: "clock-in" | "clock-out";
  coords: ClockCoords;
  queuedAt: string;
};

export type KeyValueStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

const QUEUE_KEY = "sompacare:offline-clock-queue";

export class OfflineClockQueue {
  constructor(private storage: KeyValueStorage) {}

  async list(): Promise<ClockQueueItem[]> {
    const raw = await this.storage.getItem(QUEUE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as ClockQueueItem[];
    } catch {
      return [];
    }
  }

  async enqueue(item: Omit<ClockQueueItem, "id" | "queuedAt">) {
    const queue = await this.list();
    queue.push({
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      queuedAt: new Date().toISOString(),
    });
    await this.storage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  async flush(send: (item: ClockQueueItem) => Promise<void>) {
    const queue = await this.list();
    const remaining: ClockQueueItem[] = [];

    for (const item of queue) {
      try {
        await send(item);
      } catch {
        remaining.push(item);
      }
    }

    await this.storage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    return { synced: queue.length - remaining.length, remaining: remaining.length };
  }

  async clear() {
    await this.storage.setItem(QUEUE_KEY, "[]");
  }
}
