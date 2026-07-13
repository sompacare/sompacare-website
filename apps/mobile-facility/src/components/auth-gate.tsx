import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter, useSegments } from "expo-router";
import { registerForPushNotifications } from "@/lib/push";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const onAuthScreen = segments[0] === "sign-in" || segments[0] === "sign-up";

    if (!isSignedIn && !onAuthScreen) {
      router.replace("/sign-in");
      return;
    }

    if (isSignedIn && onAuthScreen) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, segments, router]);

  useEffect(() => {
    if (!isSignedIn) return;
    registerForPushNotifications().catch(() => undefined);
  }, [isSignedIn]);

  if (!isLoaded) return null;

  return <>{children}</>;
}
