import NetInfo from "@react-native-community/netinfo";
import { OfflineClockQueue, type ClockQueueItem } from "@sompacare/mobile-shared";
import { api, asyncStorageAdapter } from "./api";

const queue = new OfflineClockQueue(asyncStorageAdapter);

export async function clockWithOfflineFallback(
  assignmentId: string,
  type: "clock-in" | "clock-out",
  coords: { latitude: number; longitude: number; accuracyMeters?: number }
) {
  const state = await NetInfo.fetch();
  if (state.isConnected) {
    if (type === "clock-in") return api.clockIn(assignmentId, coords);
    return api.clockOut(assignmentId, coords);
  }

  await queue.enqueue({ assignmentId, type, coords });
  return { queued: true, type };
}

export async function syncOfflineClockQueue() {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return { synced: 0, remaining: (await queue.list()).length };

  return queue.flush(async (item: ClockQueueItem) => {
    if (item.type === "clock-in") {
      await api.clockIn(item.assignmentId, item.coords);
    } else {
      await api.clockOut(item.assignmentId, item.coords);
    }
  });
}

export async function getQueuedClockCount() {
  return (await queue.list()).length;
}
