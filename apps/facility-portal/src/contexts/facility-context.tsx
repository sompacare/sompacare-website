"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Facility, FacilityLocation } from "@/lib/api";
import { useApi } from "@/hooks/use-api";

const STORAGE_KEY = "sompacare_selected_facility";

type FacilityContextValue = {
  facility: Facility | null;
  facilities: Facility[];
  facilityId: string | null;
  primaryLocation: FacilityLocation | null;
  loading: boolean;
  error: string | null;
  setFacilityId: (id: string) => void;
};

const FacilityContext = createContext<FacilityContextValue | null>(null);

export function FacilityProvider({ children }: { children: React.ReactNode }) {
  const api = useApi();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilityId, setFacilityIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await api.getFacilities({ limit: "50" });
        if (cancelled) return;
        const list = res.data ?? [];
        setFacilities(list);
        const saved =
          typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
        const initial =
          saved && list.some((f) => f.id === saved) ? saved : (list[0]?.id ?? null);
        setFacilityIdState(initial);
        if (initial) localStorage.setItem(STORAGE_KEY, initial);
      } catch {
        if (!cancelled) {
          setError("Could not load facilities for your organization.");
          setFacilities([]);
          setFacilityIdState(null);
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

  const setFacilityId = useCallback((id: string) => {
    setFacilityIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const facility = useMemo(
    () => facilities.find((f) => f.id === facilityId) ?? null,
    [facilities, facilityId]
  );

  const primaryLocation =
    facility?.locations.find((l) => l.isPrimary) ?? facility?.locations[0] ?? null;

  const value: FacilityContextValue = {
    facility,
    facilities,
    facilityId,
    primaryLocation,
    loading,
    error,
    setFacilityId,
  };

  return <FacilityContext.Provider value={value}>{children}</FacilityContext.Provider>;
}

export function useFacility() {
  const ctx = useContext(FacilityContext);
  if (!ctx) {
    throw new Error("useFacility must be used within FacilityProvider");
  }
  return ctx;
}
