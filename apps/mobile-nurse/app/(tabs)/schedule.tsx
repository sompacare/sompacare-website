import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, RefreshControl, Alert, View } from "react-native";
import * as Location from "expo-location";
import { formatShiftTime } from "@sompacare/mobile-shared";
import { api } from "@/lib/api";
import { clockWithOfflineFallback, getQueuedClockCount, syncOfflineClockQueue } from "@/lib/offline-sync";
import { Badge, Card, PrimaryButton, ScreenHeader } from "@/components/ui";
import { colors, spacing } from "@/theme";
import type { Assignment } from "@sompacare/mobile-shared";

export default function ScheduleScreen() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [queued, setQueued] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [res, queueCount] = await Promise.all([
      api.getAssignments({ limit: "20" }),
      getQueuedClockCount(),
    ]);
    setAssignments(res.data ?? []);
    setQueued(queueCount);
  }, []);

  useEffect(() => {
    load().catch(() => setAssignments([]));
  }, [load]);

  async function getCoords() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") throw new Error("Location permission required for clock in/out");
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      accuracyMeters: loc.coords.accuracy ?? undefined,
    };
  }

  async function confirm(id: string) {
    try {
      await api.confirmAssignment(id);
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not confirm");
    }
  }

  async function clock(id: string, type: "clock-in" | "clock-out") {
    try {
      const coords = await getCoords();
      const result = await clockWithOfflineFallback(id, type, coords);
      if ("queued" in result && result.queued) {
        Alert.alert("Saved offline", "Clock event queued — will sync when online.");
      } else {
        Alert.alert("Success", type === "clock-in" ? "Clocked in" : "Clocked out");
      }
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Clock action failed");
    }
  }

  async function syncQueue() {
    const result = await syncOfflineClockQueue();
    Alert.alert("Sync complete", `Synced ${result.synced}, ${result.remaining} remaining`);
    await load();
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
    >
      <ScreenHeader title="My schedule" subtitle="Assignments and GPS clock in/out" />

      {queued > 0 && (
        <Card style={styles.queueCard}>
          <Text style={styles.queueText}>{queued} offline clock event(s) pending</Text>
          <PrimaryButton label="Sync now" onPress={syncQueue} />
        </Card>
      )}

      {assignments.map((a) => {
        const { date, time } = formatShiftTime(a.shift.startTime, a.shift.endTime);
        return (
          <Card key={a.id}>
            <Text style={styles.title}>{a.shift.title}</Text>
            <Text style={styles.meta}>{a.shift.facility.name}</Text>
            <Text style={styles.meta}>{date} · {time}</Text>
            <Badge label={a.status.replace(/_/g, " ")} tone="default" />
            <View style={styles.actions}>
              {a.status === "PENDING_CONFIRMATION" && (
                <PrimaryButton label="Confirm" onPress={() => confirm(a.id)} />
              )}
              {["CONFIRMED", "CHECKED_IN"].includes(a.status) && (
                <PrimaryButton
                  label={a.status === "CHECKED_IN" ? "Clock out" : "Clock in"}
                  onPress={() => clock(a.id, a.status === "CHECKED_IN" ? "clock-out" : "clock-in")}
                />
              )}
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingTop: spacing.lg },
  title: { fontSize: 16, fontWeight: "700", color: colors.navy },
  meta: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 8 },
  actions: { marginTop: 12, gap: 8 },
  queueCard: { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" },
  queueText: { color: colors.navy, marginBottom: 8 },
});
