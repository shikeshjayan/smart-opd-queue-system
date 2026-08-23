"use client";

import type { ReactNode } from "react";
import type { UserRole } from "../types/auth.types";
import { RoleGuard } from "./RoleGuard";
import { SessionWarning } from "@/features/security/components/SessionWarning";

const ALL_ROLES: readonly UserRole[] = [
  "patient",
  "doctor",
  "clinical_staff",
  "receptionist",
  "lab_staff",
  "hospital_admin",
  "district_admin",
  "state_admin",
];

type ProtectedRouteProps = {
  children: ReactNode;
  expiredMode?: "redirect" | "inline";
};

export function ProtectedRoute({ children, expiredMode = "redirect" }: ProtectedRouteProps) {
  return (
    <RoleGuard roles={ALL_ROLES} expiredMode={expiredMode}>
      {children}
      <SessionWarning />
    </RoleGuard>
  );
}