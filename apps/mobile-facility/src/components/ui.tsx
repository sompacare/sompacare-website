import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, spacing } from "@/theme";

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Badge({ label, tone = "default" }: { label: string; tone?: "default" | "success" | "warning" }) {
  const bg = tone === "success" ? "#ecfdf5" : tone === "warning" ? "#fffbeb" : "#f1f5f9";
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Text style={styles.button} onPress={onPress}>{label}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  header: { marginBottom: spacing.lg },
  title: { fontSize: 24, fontWeight: "700", color: colors.navy },
  subtitle: { marginTop: 4, fontSize: 14, color: colors.muted },
  badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  badgeText: { fontSize: 11, fontWeight: "700", color: colors.navy, textTransform: "uppercase" },
  button: {
    backgroundColor: colors.primary,
    color: "#fff",
    textAlign: "center",
    borderRadius: 12,
    paddingVertical: 12,
    fontWeight: "700",
  },
});
