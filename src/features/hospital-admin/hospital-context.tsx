"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Hospital } from "@/types";
import { DEFAULT_HOSPITAL_ID } from "@/config/app";
import { adminMockApi } from "./api/admin.mock";
import type { HospitalAdminContextValue } from "./types/hospital-admin.types";

const HospitalAdminContext = createContext<HospitalAdminContextValue | null>(null);

export function HospitalAdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<HospitalAdminContextValue["admin"]>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalId, setHospitalId] = useState<string>(DEFAULT_HOSPITAL_ID);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [profile, list] = await Promise.all([
        adminMockApi.getProfile(),
        adminMockApi.listHospitals(),
      ]);
      if (cancelled) return;
      setAdmin({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
      });
      setHospitals(list);
      setHospitalId(profile.hospitalId || DEFAULT_HOSPITAL_ID);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const hospital = hospitals.find((h) => h.id === hospitalId) ?? null;

  return (
    <HospitalAdminContext.Provider
      value={{ admin, hospitals, hospitalId, hospital, loading: !admin, setHospitalId }}
    >
      {children}
    </HospitalAdminContext.Provider>
  );
}

export function useHospitalAdmin(): HospitalAdminContextValue {
  const context = useContext(HospitalAdminContext);
  if (!context) {
    throw new Error("useHospitalAdmin must be used within HospitalAdminProvider");
  }
  return context;
}
