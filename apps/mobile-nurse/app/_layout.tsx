import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { requireBiometricIfEnabled } from "@/lib/biometric";
import { registerForPushNotifications } from "@/lib/push";
import { syncOfflineClockQueue } from "@/lib/offline-sync";

export default function RootLayout() {
  useEffect(() => {
    requireBiometricIfEnabled().catch(() => undefined);
    registerForPushNotifications().catch(() => undefined);
    syncOfflineClockQueue().catch(() => undefined);
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
