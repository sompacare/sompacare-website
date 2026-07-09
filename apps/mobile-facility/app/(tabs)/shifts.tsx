import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, Alert } from "react-native";
import { formatShiftTime } from "@sompacare/mobile-shared";
import { api } from "@/lib/api";
import { Badge, Card, PrimaryButton, ScreenHeader } from "@/components/ui";
import { colors, spacing } from "@/theme";
import type { Shift } from "@sompacare/mobile-shared";

export default function ShiftsScreen() {
  const [shifts, setShifts] = useState<Shift[]>([]);

  const load = useCallback(async () => {
    const res = await api.getShifts({ limit: "30" });
    setShifts(res.data ?? []);
  }, []);

  useEffect(() => {
    load().catch(() => setShifts([]));
  }, [load]);

  async function publish(id: string) {
    try {
      await api.publishShift(id);
      Alert.alert("Published", "Shift is now live for workers.");
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Publish failed");
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Shifts" subtitle="Draft and published listings" />
      {shifts.map((shift) => {
        const { date, time } = formatShiftTime(shift.startTime, shift.endTime);
        return (
          <Card key={shift.id}>
            <Text style={styles.title}>{shift.title}</Text>
            <Text style={styles.meta}>{date} · {time}</Text>
            <Badge label={shift.status} tone={shift.status === "PUBLISHED" ? "success" : "default"} />
            {shift.status === "DRAFT" && (
              <PrimaryButton label="Publish" onPress={() => publish(shift.id)} />
            )}
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
  meta: { fontSize: 13, color: colors.muted, marginVertical: 8 },
});
