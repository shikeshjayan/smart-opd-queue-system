"use client";

import type { ReactNode } from "react";
import { usePermissions } from "../hooks/useAuth";
import type { Permission } from "../permissions";

type PermissionGuardProps = {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
};

export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const { can } = usePermissions();
  if (!can(permission)) return <>{fallback}</>;
  return <>{children}</>;
}