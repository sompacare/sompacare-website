"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Sends signed-in users to the app home (e.g. from /sign-in or /sign-up). */
export function useRedirectIfSignedIn(homePath = "/home") {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace(homePath);
    }
  }, [homePath, isLoaded, isSignedIn, router]);

  return isLoaded && isSignedIn;
}
