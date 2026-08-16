"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { governmentMockApi } from "./api/government.mock";
import type { StateAdminContextValue } from "./types/government.types";

const StateAdminContext = createContext<StateAdminContextValue | null>(null);

export function StateAdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<StateAdminContextValue["admin"]>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const profile = await governmentMockApi.getStateProfile();
      if (cancelled) return;
      setAdmin(profile);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return <StateAdminContext.Provider value={{ admin, loading: !admin }}>{children}</StateAdminContext.Provider>;
}

export function useStateAdmin(): StateAdminContextValue {
  const context = useContext(StateAdminContext);
  if (!context) {
    throw new Error("useStateAdmin must be used within StateAdminProvider");
  }
  return context;
}
