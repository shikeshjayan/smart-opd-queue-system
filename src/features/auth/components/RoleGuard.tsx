"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { matchesAnyRole } from "../guards";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types/auth.types";
import { AuthLoading } from "./AuthLoading";
import { SessionExpired } from "./SessionExpired";

type RoleGuardProps = {
  roles: readonly UserRole[];
  children: ReactNode;
  expiredMode?: "redirect" | "inline";
};

export function RoleGuard({ roles, children, expiredMode = "redirect" }: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user, expired } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated" && !(expired && expiredMode === "inline")) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (status === "authenticated" && !matchesAnyRole(user?.role, roles)) {
      router.replace("/unauthorized");
    }
  }, [status, expired, expiredMode, pathname, router, user, roles]);

  if (status === "loading") {
    return <AuthLoading />;
  }

  if (status === "unauthenticated") {
    if (expired && expiredMode === "inline") {
      return (
        <SessionExpired
          onSignIn={() => router.push(`/login?next=${encodeURIComponent(pathname)}`)}
        >
          {children}
        </SessionExpired>
      );
    }
    return <AuthLoading />;
  }

  if (!matchesAnyRole(user?.role, roles)) {
    return <AuthLoading />;
  }

  return <>{children}</>;
}