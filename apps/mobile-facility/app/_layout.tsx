import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { registerForPushNotifications } from "@/lib/push";

export default function RootLayout() {
  useEffect(() => {
    registerForPushNotifications().catch(() => undefined);
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
