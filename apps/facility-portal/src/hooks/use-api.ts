"use client";

import { useAuth } from "@clerk/nextjs";
import { fetchClerkApiToken } from "@sompacare/shared";
import { useMemo, useRef } from "react";
import { createApiClient } from "@/lib/api";

export function useApi() {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  return useMemo(
    () =>
      createApiClient(async () =>
        fetchClerkApiToken((options) => getTokenRef.current(options))
      ),
    []
  );
}
