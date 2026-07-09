"use client";

import { useEffect, useState } from "react";
import type { Facility } from "@/lib/api";
import { useApi } from "@/hooks/use-api";

export function useFacility() {
  const api = useApi();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await api.getFacilities();
        if (!cancelled) {
          setFacility(res.data[0] ?? null);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load facility. Ensure your account has FACILITY_MANAGER role.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const primaryLocation =
    facility?.locations.find((l) => l.isPrimary) ?? facility?.locations[0] ?? null;

  return { facility, primaryLocation, loading, error };
}
