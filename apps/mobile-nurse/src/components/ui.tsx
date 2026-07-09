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

export function Badge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneStyle =
    tone === "success"
      ? styles.badgeSuccess
      : tone === "warning"
        ? styles.badgeWarning
        : tone === "danger"
          ? styles.badgeDanger
          : styles.badgeDefault;

  return (
    <View style={[styles.badge, toneStyle]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Text
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={disabled ? undefined : onPress}
    >
      {label}
    </Text>
  );
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
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.navy,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: colors.muted,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeDefault: { backgroundColor: "#f1f5f9" },
  badgeSuccess: { backgroundColor: "#ecfdf5" },
  badgeWarning: { backgroundColor: "#fffbeb" },
  badgeDanger: { backgroundColor: "#fef2f2" },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.navy,
    textTransform: "uppercase",
  },
  button: {
    backgroundColor: colors.primary,
    color: "#fff",
    textAlign: "center",
    overflow: "hidden",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
