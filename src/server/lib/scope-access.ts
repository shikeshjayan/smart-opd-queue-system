"use server";

import "server-only";
import { createAccessContext, type AccessContext } from "./access-context";
import type { Permission } from "@/features/auth/permissions";

export class ScopeError extends Error {
  constructor(message: string, public code: "FORBIDDEN" | "INVALID_SCOPE") {
    super(message);
    this.name = "ScopeError";
  }
}

export function assertDistrictAccess(ctx: AccessContext, districtId: string): void {
  if (!ctx.districtIds.includes(districtId)) {
    throw new ScopeError(`No access to district ${districtId}`, "FORBIDDEN");
  }
}

export function assertHospitalAccess(ctx: AccessContext, hospitalId: string): void {
  if (!ctx.hospitalIds.includes(hospitalId)) {
    throw new ScopeError(`No access to hospital ${hospitalId}`, "FORBIDDEN");
  }
}

export function assertDepartmentAccess(ctx: AccessContext, departmentId: string): void {
  if (!ctx.departmentIds.includes(departmentId)) {
    throw new ScopeError(`No access to department ${departmentId}`, "FORBIDDEN");
  }
}

export function assertAnyHospitalAccess(ctx: AccessContext): void {
  if (ctx.hospitalIds.length === 0) {
    throw new ScopeError("No hospital access granted", "FORBIDDEN");
  }
}

export function assertAnyDistrictAccess(ctx: AccessContext): void {
  if (ctx.districtIds.length === 0) {
    throw new ScopeError("No district access granted", "FORBIDDEN");
  }
}

export function buildScopeFilter(
  ctx: AccessContext,
  entityType: "hospital" | "patient" | "appointment" | "queue" | "district" | "staff" | "department"
): Record<string, unknown> {
  const filter: Record<string, unknown> = {};

  switch (entityType) {
    case "hospital":
      filter._id = { $in: ctx.hospitalIds };
      break;
    case "patient":
    case "appointment":
    case "queue":
    case "staff":
      filter.hospitalId = { $in: ctx.hospitalIds };
      break;
    case "district":
      filter._id = { $in: ctx.districtIds };
      break;
    case "department":
      filter.hospitalId = { $in: ctx.hospitalIds };
      break;
  }

  return filter;
}

export function validateScope(
  ctx: AccessContext,
  requiredScopes: Array<{ type: "district" | "hospital" | "department"; id: string }>
): void {
  for (const scope of requiredScopes) {
    switch (scope.type) {
      case "district":
        assertDistrictAccess(ctx, scope.id);
        break;
      case "hospital":
        assertHospitalAccess(ctx, scope.id);
        break;
      case "department":
        assertDepartmentAccess(ctx, scope.id);
        break;
    }
  }
}

export function mergeScopeFilters(
  ctx: AccessContext,
  customFilter: Record<string, unknown>,
  entityType: "hospital" | "patient" | "appointment" | "queue" | "district" | "staff" | "department"
): Record<string, unknown> {
  const scopeFilter = buildScopeFilter(ctx, entityType);
  return { ...customFilter, ...scopeFilter };
}

export function assertPermission(ctx: AccessContext, permission: string): void {
  if (!ctx.permissions.includes(permission as Permission)) {
    throw new ScopeError(`Missing permission: ${permission}`, "FORBIDDEN");
  }
}

export function assertAnyPermission(ctx: AccessContext, permissions: string[]): void {
  if (!permissions.some((p) => ctx.permissions.includes(p as Permission))) {
    throw new ScopeError(`Missing one of required permissions: ${permissions.join(", ")}`, "FORBIDDEN");
  }
}