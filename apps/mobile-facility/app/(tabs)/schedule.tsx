import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, Alert } from "react-native";
import { api } from "@/lib/api";
import type { Timecard } from "@sompacare/mobile-shared";
import { Badge, Card, PrimaryButton, ScreenHeader } from "@/components/ui";
import { colors, spacing } from "@/theme";

export default function ScheduleScreen() {
  const [timecards, setTimecards] = useState<Timecard[]>([]);

  const load = useCallback(async () => {
    const res = await api.getTimecards({ limit: "30", status: "SUBMITTED" });
    setTimecards(res.data ?? []);
  }, []);

  useEffect(() => {
    load().catch(() => setTimecards([]));
  }, [load]);

  async function approve(id: string) {
    try {
      await api.approveTimecard(id);
      Alert.alert("Approved", "Timecard approved and invoice queued.");
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Approval failed");
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Timecards" subtitle="Approve submitted hours" />
      {timecards.length === 0 ? (
        <Text style={styles.empty}>No timecards awaiting approval.</Text>
      ) : (
        timecards.map((tc) => (
          <Card key={tc.id}>
            <Text style={styles.title}>
              {tc.worker.firstName} {tc.worker.lastName}
            </Text>
            <Text style={styles.meta}>{tc.assignment.shift.title}</Text>
            <Badge label={tc.status} tone="warning" />
            <PrimaryButton label="Approve" onPress={() => approve(tc.id)} />
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingTop: spacing.lg },
  title: { fontSize: 16, fontWeight: "700", color: colors.navy },
  meta: { fontSize: 13, color: colors.muted, marginVertical: 8 },
  empty: { color: colors.muted },
});
