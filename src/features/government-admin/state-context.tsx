"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { StateAdminContextValue } from "./types/government.types";

const StateAdminContext = createContext<StateAdminContextValue | null>(null);

export function StateAdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const admin = user ? { id: user.id, name: user.name, email: "", phone: "" } : null;

  return (
    <StateAdminContext.Provider value={{ admin, loading: !admin }}>
      {children}
    </StateAdminContext.Provider>
  );
}

export function useStateAdmin(): StateAdminContextValue {
  const context = useContext(StateAdminContext);
  if (!context) {
    throw new Error("useStateAdmin must be used within StateAdminProvider");
  }
  return context;
}