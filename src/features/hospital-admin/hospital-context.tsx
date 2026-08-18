"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Hospital } from "@/types";
import { DEFAULT_HOSPITAL_ID } from "@/config/app";
import { roleLabel } from "@/features/auth/roles";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { adminMockApi } from "./api/admin.mock";
import type { HospitalAdminContextValue } from "./types/hospital-admin.types";

const HospitalAdminContext = createContext<HospitalAdminContextValue | null>(null);

export function HospitalAdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [admin, setAdmin] = useState<HospitalAdminContextValue["admin"]>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalId, setHospitalId] = useState<string>(DEFAULT_HOSPITAL_ID);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const list = await adminMockApi.listHospitals();
      if (cancelled) return;
      if (user) {
        setAdmin({
          id: user.id,
          name: user.name,
          email: "",
          role: roleLabel(user.role),
        });
        if (user.scope.hospitalId) {
          setHospitalId(user.scope.hospitalId);
          setHospitals(list.filter((h) => h.id === user.scope.hospitalId));
          return;
        }
      }
      setHospitals(list);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

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
