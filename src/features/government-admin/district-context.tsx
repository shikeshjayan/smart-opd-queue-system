"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getDistrictName } from "@/config/districts";
import { DISTRICT_ADMIN_DISTRICT_ID } from "@/config/app";
import { governmentMockApi } from "./api/government.mock";
import type { DistrictAdminContextValue } from "./types/government.types";

const DistrictAdminContext = createContext<DistrictAdminContextValue | null>(null);

export function DistrictAdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<DistrictAdminContextValue["admin"]>(null);
  const [districtId, setDistrictId] = useState<DistrictAdminContextValue["districtId"]>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const profile = await governmentMockApi.getDistrictProfile();
      if (cancelled) return;
      setAdmin(profile);
      setDistrictId(profile.districtId || DISTRICT_ADMIN_DISTRICT_ID);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const scope = districtId ?? DISTRICT_ADMIN_DISTRICT_ID;

  return (
    <DistrictAdminContext.Provider
      value={{
        admin,
        districtId: districtId as DistrictAdminContextValue["districtId"],
        districtName: getDistrictName(scope),
        loading: !admin,
      }}
    >
      {children}
    </DistrictAdminContext.Provider>
  );
}

export function useDistrictAdmin(): DistrictAdminContextValue {
  const context = useContext(DistrictAdminContext);
  if (!context) {
    throw new Error("useDistrictAdmin must be used within DistrictAdminProvider");
  }
  return context;
}
