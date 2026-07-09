import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const BIOMETRIC_KEY = "sompacare:nurse:biometric";

export async function isBiometricAvailable() {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function getBiometricEnabled() {
  const value = await SecureStore.getItemAsync(BIOMETRIC_KEY);
  return value === "true";
}

export async function setBiometricEnabled(enabled: boolean) {
  await SecureStore.setItemAsync(BIOMETRIC_KEY, enabled ? "true" : "false");
}

export async function authenticateWithBiometrics() {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock Sompacare Nurse",
    fallbackLabel: "Use passcode",
  });
  return result.success;
}

export async function requireBiometricIfEnabled() {
  if (process.env.EXPO_PUBLIC_BIOMETRIC_ENABLED !== "true") return true;
  const enabled = await getBiometricEnabled();
  if (!enabled) return true;
  return authenticateWithBiometrics();
}
