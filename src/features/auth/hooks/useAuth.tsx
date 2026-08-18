"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { authMockApi } from "../api/auth.mock";
import { roleHasPermission } from "../permissions";
import type { Permission } from "../permissions";
import type { AuthState, SessionUser } from "../types/auth.types";

type AuthContextValue = AuthState & {
  authorize: (user: SessionUser) => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  can: (permission: Permission) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
    expired: false,
  });

  useEffect(() => {
    let cancelled = false;
    authMockApi.restore().then((result) => {
      if (cancelled) return;
      if (result.session) {
        setState({ status: "authenticated", user: result.session.user, expired: false });
      } else if (result.reason === "expired") {
        setState({ status: "unauthenticated", user: null, expired: true });
      } else {
        setState({ status: "unauthenticated", user: null, expired: false });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    const result = await authMockApi.restore();
    if (result.session) {
      setState({ status: "authenticated", user: result.session.user, expired: false });
    } else if (result.reason === "expired") {
      setState({ status: "unauthenticated", user: null, expired: true });
    } else {
      setState({ status: "unauthenticated", user: null, expired: false });
    }
  }, []);

  const authorize = useCallback((user: SessionUser) => {
    setState({ status: "authenticated", user, expired: false });
  }, []);

  const signOut = useCallback(async () => {
    await authMockApi.logout();
    setState({ status: "unauthenticated", user: null, expired: false });
  }, []);

  const can = useCallback(
    (permission: Permission) => roleHasPermission(state.user?.role, permission),
    [state.user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, authorize, signOut, refresh, can }),
    [state, authorize, signOut, refresh, can]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function usePermissions() {
  const { can } = useAuth();
  return { can };
}