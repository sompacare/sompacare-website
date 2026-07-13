import { useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, Switch, Alert, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";
import {
  authenticateWithBiometrics,
  getBiometricEnabled,
  isBiometricAvailable,
  setBiometricEnabled,
} from "@/lib/biometric";
import { api } from "@/lib/api";
import { Card, PrimaryButton, ScreenHeader } from "@/components/ui";
import { colors, spacing } from "@/theme";

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricOn, setBiometricOn] = useState(false);
  const [complianceScore, setComplianceScore] = useState<number | null>(null);

  useEffect(() => {
    isBiometricAvailable().then(setBiometricAvailable);
    getBiometricEnabled().then(setBiometricOn);
    api.getCompliance().then((r) => setComplianceScore(r.data?.score ?? null)).catch(() => undefined);
  }, []);

  async function toggleBiometric(value: boolean) {
    if (value) {
      const ok = await authenticateWithBiometrics();
      if (!ok) return;
    }
    await setBiometricEnabled(value);
    setBiometricOn(value);
  }

  async function uploadCredential() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Camera access is required to scan documents.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets[0]) return;

    const expiresAt = new Date(Date.now() + 86400000 * 365).toISOString();
    await api.submitLicense({
      type: "RN",
      number: `MOB-${Date.now().toString().slice(-6)}`,
      state: "MD",
      expiresAt,
      documentUrl: result.assets[0].uri,
    });

    Alert.alert("Uploaded", "Credential submitted for verification.");
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Profile" subtitle="Security and credentials" />

      <Card>
        <Text style={styles.label}>Compliance score</Text>
        <Text style={styles.score}>{complianceScore ?? "—"}</Text>
      </Card>

      {biometricAvailable && (
        <Card style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Biometric login</Text>
            <Text style={styles.hint}>Require Face ID / fingerprint on app open</Text>
          </View>
          <Switch value={biometricOn} onValueChange={toggleBiometric} />
        </Card>
      )}

      <Card>
        <Text style={styles.label}>Upload credential</Text>
        <Text style={styles.hint}>Scan license or certification with your camera.</Text>
        <PrimaryButton label="Scan document" onPress={uploadCredential} />
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
  label: { fontSize: 14, fontWeight: "700", color: colors.navy },
  hint: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 12, lineHeight: 20 },
  score: { fontSize: 32, fontWeight: "700", color: colors.primary, marginTop: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
});
