import { Tabs } from "expo-router";
import { colors } from "@/theme";
import { BrandLogo } from "@/components/brand-logo";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: () => <BrandLogo height={28} />,
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: colors.card },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="shifts" options={{ title: "Shifts" }} />
      <Tabs.Screen name="applicants" options={{ title: "Applicants" }} />
      <Tabs.Screen name="schedule" options={{ title: "Timecards" }} />
    </Tabs>
  );
}
