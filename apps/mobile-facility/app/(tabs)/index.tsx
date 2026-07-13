import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, RefreshControl, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { api } from "@/lib/api";
import { Badge, Card, PrimaryButton, ScreenHeader } from "@/components/ui";
import { colors, spacing } from "@/theme";

export default function HomeScreen() {
  const { signOut } = useAuth();
  const [openShifts, setOpenShifts] = useState(0);
  const [pendingApps, setPendingApps] = useState(0);
  const [pendingTimecards, setPendingTimecards] = useState(0);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    const [shifts, apps, timecards, unreadRes] = await Promise.all([
      api.getShifts({ limit: "50", status: "PUBLISHED" }),
      api.getApplications({ limit: "50", status: "PENDING" }),
      api.getTimecards({ limit: "50", status: "SUBMITTED" }),
      api.getUnreadCount(),
    ]);
    setOpenShifts(shifts.data?.length ?? 0);
    setPendingApps(apps.data?.length ?? 0);
    setPendingTimecards(timecards.data?.length ?? 0);
    setUnread(unreadRes.count ?? 0);
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Facility dashboard" subtitle="Manage staffing on the go" />
      <View style={styles.grid}>
        <Card style={styles.stat}>
          <Text style={styles.label}>Published shifts</Text>
          <Text style={styles.value}>{openShifts}</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={styles.label}>Pending apps</Text>
          <Text style={styles.value}>{pendingApps}</Text>
        </Card>
      </View>
      <Card>
        <Text style={styles.label}>Timecards to approve</Text>
        <Text style={styles.value}>{pendingTimecards}</Text>
      </Card>
      <Card>
        <Text style={styles.label}>Unread notifications</Text>
        <Text style={styles.value}>{unread}</Text>
        {unread > 0 && <Badge label="Action needed" tone="warning" />}
      </Card>
      <Card>
        <PrimaryButton label="Sign out" onPress={() => signOut()} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingTop: spacing.lg },
  grid: { flexDirection: "row", gap: spacing.sm },
  stat: { flex: 1 },
  label: { fontSize: 12, color: colors.muted, fontWeight: "600", textTransform: "uppercase" },
  value: { fontSize: 28, fontWeight: "700", color: colors.navy, marginTop: 8 },
});
