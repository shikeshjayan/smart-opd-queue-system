"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { getDistrictName } from "@/config/districts";
import { DISTRICT_ADMIN_DISTRICT_ID } from "@/config/app";
import type { DistrictId } from "@/config/districts";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { DistrictAdminContextValue } from "./types/government.types";

const DistrictAdminContext = createContext<DistrictAdminContextValue | null>(null);

export function DistrictAdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const districtId =
    (user?.scope.districtId as DistrictId | undefined) ?? DISTRICT_ADMIN_DISTRICT_ID;

  const admin = user
    ? {
        id: user.id,
        name: user.name,
        email: "",
        phone: "",
        districtId,
      }
    : null;

  return (
    <DistrictAdminContext.Provider
      value={{
        admin,
        districtId,
        districtName: getDistrictName(districtId),
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