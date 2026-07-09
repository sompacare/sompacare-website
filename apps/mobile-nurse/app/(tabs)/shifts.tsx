import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, RefreshControl, Alert, View } from "react-native";
import { formatShiftTime } from "@sompacare/mobile-shared";
import { api } from "@/lib/api";
import { Badge, Card, PrimaryButton, ScreenHeader } from "@/components/ui";
import { colors, spacing } from "@/theme";
import type { Shift } from "@sompacare/mobile-shared";

export default function ShiftsScreen() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const recRes = await api.getRecommendedShifts(30);
      const recommendations = recRes.recommendations ?? [];
      if (recommendations.length > 0) {
        setShifts(
          recommendations.map((r) => ({
            ...r.shift,
            matchScore: r.score > 0 ? r.score : undefined,
          }))
        );
        return;
      }
    } catch {
      // fall back to plain shift list
    }

    const res = await api.getShifts({ limit: "30", status: "PUBLISHED" });
    setShifts(res.data ?? []);
  }, []);

  useEffect(() => {
    load().catch(() => setShifts([]));
  }, [load]);

  async function apply(shift: Shift) {
    try {
      await api.applyToShift(shift.id, "Applied via mobile app");
      Alert.alert("Applied", `You applied to ${shift.title}`);
    } catch (e) {
      Alert.alert("Could not apply", e instanceof Error ? e.message : "Unknown error");
    }
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
      <ScreenHeader title="Browse shifts" subtitle="AI-ranked opportunities for you" />

      {shifts.map((shift) => {
        const { date, time } = formatShiftTime(shift.startTime, shift.endTime);
        return (
          <Card key={shift.id}>
            <Text style={styles.title}>{shift.title}</Text>
            <Text style={styles.meta}>{shift.facility.name}</Text>
            <Text style={styles.meta}>
              {date} · {time}
            </Text>
            <Text style={styles.rate}>${Number(shift.hourlyRate)}/hr</Text>
            <View style={styles.row}>
              {shift.isEmergency && <Badge label="Urgent" tone="danger" />}
              {shift.matchScore != null && (
                <Badge label={`${shift.matchScore}% match`} tone="success" />
              )}
            </View>
            <PrimaryButton label="Apply" onPress={() => apply(shift)} />
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
  meta: { fontSize: 13, color: colors.muted, marginTop: 4 },
  rate: { fontSize: 15, fontWeight: "700", color: colors.primary, marginVertical: 8 },
  row: { flexDirection: "row", gap: 8, marginBottom: 12 },
});
