"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { DEFAULT_HOSPITAL_ID } from "@/config/app";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getHospital } from "@/services/data";
import type { Hospital } from "@/types";

type ReceptionContextValue = {
  hospitalId: string;
  hospital: Hospital | null;
  counter: string;
  receptionistName: string;
  active: boolean;
};

const ReceptionContext = createContext<ReceptionContextValue | null>(null);

export function ReceptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const hospitalId = user?.scope.hospitalId ?? DEFAULT_HOSPITAL_ID;
  const hospital = getHospital(hospitalId) ?? null;

  return (
    <ReceptionContext.Provider
      value={{
        hospitalId,
        hospital,
        counter: "02",
        receptionistName: user?.name ?? "Receptionist",
        active: true,
      }}
    >
      {children}
    </ReceptionContext.Provider>
  );
}

export function useReception(): ReceptionContextValue {
  const context = useContext(ReceptionContext);
  if (!context) {
    throw new Error("useReception must be used within ReceptionProvider");
  }
  return context;
}