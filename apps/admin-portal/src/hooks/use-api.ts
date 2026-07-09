"use client";

import { useAuth } from "@clerk/nextjs";
import { useMemo, useRef } from "react";
import { createApiClient } from "@/lib/api";

const forceDevToken =
  process.env.NEXT_PUBLIC_ADMIN_PORTAL_FORCE_DEV_TOKEN === "true";

export function useApi() {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  return useMemo(
    () =>
      createApiClient(async () => {
        if (forceDevToken) return null;
        try {
          return await getTokenRef.current();
        } catch {
          return null;
        }
      }),
    []
  );
}
