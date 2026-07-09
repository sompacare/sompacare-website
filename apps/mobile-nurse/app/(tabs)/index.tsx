import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, RefreshControl, View } from "react-native";
import { formatCurrency, estimateShiftEarnings } from "@sompacare/mobile-shared";
import { api } from "@/lib/api";
import { Badge, Card, ScreenHeader } from "@/components/ui";
import { colors, spacing } from "@/theme";
import type { Assignment, Shift } from "@sompacare/mobile-shared";

export default function HomeScreen() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [compliant, setCompliant] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [shiftRes, assignmentRes, complianceRes] = await Promise.all([
        api.getRecommendedShifts(6),
        api.getAssignments({ limit: "10" }),
        api.getCompliance(),
      ]);
      setShifts(
        shiftRes.recommendations?.map((r) => ({
          ...r.shift,
          matchScore: r.score > 0 ? r.score : undefined,
        })) ?? []
      );
      setAssignments(assignmentRes.data ?? []);
      setCompliant(complianceRes.data?.isCompliant ?? true);
    } catch {
      setShifts([]);
      setAssignments([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const weekly = assignments.reduce((sum, a) => {
    const rate = Number(a.shift.hourlyRate);
    return sum + estimateShiftEarnings(rate, a.shift.startTime, a.shift.endTime);
  }, 0);

  const pending = assignments.filter((a) => a.status === "PENDING_CONFIRMATION");

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }} />}
    >
      <ScreenHeader title="Good morning 👋" subtitle="Your shift marketplace" />

      {!compliant && (
        <Card style={styles.alert}>
          <Text style={styles.alertText}>Some credentials need attention. Check Profile.</Text>
        </Card>
      )}

      <View style={styles.grid}>
        <Card style={styles.stat}>
          <Text style={styles.statLabel}>This week</Text>
          <Text style={styles.statValue}>{formatCurrency(weekly)}</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={styles.statLabel}>Open shifts</Text>
          <Text style={styles.statValue}>{shifts.length}</Text>
        </Card>
      </View>

      {pending.length > 0 && (
        <>
          <Text style={styles.section}>Confirm shifts</Text>
          {pending.map((a) => (
            <Card key={a.id}>
              <Text style={styles.cardTitle}>{a.shift.title}</Text>
              <Text style={styles.cardMeta}>{a.shift.facility.name}</Text>
              <Badge label="Confirm" tone="warning" />
            </Card>
          ))}
        </>
      )}

      <Text style={styles.section}>Recommended</Text>
      {shifts.length === 0 ? (
        <Text style={styles.empty}>No shifts available right now.</Text>
      ) : (
        shifts.slice(0, 4).map((shift) => (
          <Card key={shift.id}>
            <Text style={styles.cardTitle}>{shift.title}</Text>
            <Text style={styles.cardMeta}>
              {shift.facility.name} · ${Number(shift.hourlyRate)}/hr
            </Text>
            {shift.matchScore != null && <Badge label={`Match ${shift.matchScore}%`} tone="success" />}
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingTop: spacing.lg },
  grid: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  stat: { flex: 1 },
  statLabel: { fontSize: 12, color: colors.muted, fontWeight: "600", textTransform: "uppercase" },
  statValue: { fontSize: 24, fontWeight: "700", color: colors.navy, marginTop: 8 },
  section: { fontSize: 16, fontWeight: "700", color: colors.navy, marginBottom: spacing.sm, marginTop: spacing.sm },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.navy },
  cardMeta: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 8 },
  empty: { color: colors.muted, fontSize: 14 },
  alert: { backgroundColor: "#fffbeb", borderColor: "#fde68a" },
  alertText: { color: "#92400e", fontSize: 14 },
});
