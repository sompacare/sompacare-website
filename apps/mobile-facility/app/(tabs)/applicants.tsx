import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, Alert } from "react-native";
import { api } from "@/lib/api";
import { Badge, Card, PrimaryButton, ScreenHeader } from "@/components/ui";
import { colors, spacing } from "@/theme";
import type { Application } from "@sompacare/mobile-shared";

export default function ApplicantsScreen() {
  const [applications, setApplications] = useState<Application[]>([]);

  const load = useCallback(async () => {
    const res = await api.getApplications({ limit: "30", status: "PENDING" });
    setApplications(res.data ?? []);
  }, []);

  useEffect(() => {
    load().catch(() => setApplications([]));
  }, [load]);

  async function approve(id: string) {
    try {
      await api.approveApplication(id);
      Alert.alert("Approved", "Applicant moved to assignment.");
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Approve failed");
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Applicants" subtitle="Review pending applications" />
      {applications.length === 0 ? (
        <Text style={styles.empty}>No pending applications.</Text>
      ) : (
        applications.map((app) => (
          <Card key={app.id}>
            <Text style={styles.title}>
              {app.applicant.firstName} {app.applicant.lastName}
            </Text>
            <Text style={styles.meta}>{app.shift.title}</Text>
            {app.matchScore != null && (
              <Badge label={`${app.matchScore}% match`} tone="success" />
            )}
            <PrimaryButton label="Approve" onPress={() => approve(app.id)} />
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
