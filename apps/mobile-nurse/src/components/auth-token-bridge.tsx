import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { registerAuthTokenGetter } from "@sompacare/mobile-shared";

export function AuthTokenBridge() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    registerAuthTokenGetter(async () => {
      if (!isSignedIn) return null;
      return getToken();
    });
  }, [getToken, isSignedIn]);

  return null;
}
