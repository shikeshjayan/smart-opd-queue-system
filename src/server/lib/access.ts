import "server-only";

import { getSession } from "@/lib/auth";
import { StaffAssignmentModel, plain, plainList } from "@/lib/models";
import { roleHasPermission, type Permission } from "@/features/auth/permissions";
import type { SessionUser } from "@/features/auth/types/auth.types";
import type { StaffAssignment } from "@/types";

const HIERARCHY_ROLES: ReadonlySet<SessionUser["role"]> = new Set([
  "district_admin",
  "state_admin",
]);

export class AccessDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccessDeniedError";
  }
}

/** Require an authenticated session with the given permission. */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new AccessDeniedError("UNAUTHENTICATED: Please sign in to continue.");
  }
  if (!roleHasPermission(session.role, permission)) {
    throw new AccessDeniedError(`FORBIDDEN: Missing permission ${permission}.`);
  }
  return session;
}

/** Active hospital assignments for a user (staff side). */
export async function getActiveAssignments(userId: string): Promise<StaffAssignment[]> {
  const docs = await StaffAssignmentModel.find({ staffId: userId, status: "active" }).lean();
  return plainList<StaffAssignment>(docs);
}

/**
 * Hospital ids the user is allowed to operate on:
 * - district/state admins: any (hierarchy scope)
 * - everyone else: explicit session scope + active staff assignments
 */
export async function getAllowedHospitalIds(user: SessionUser): Promise<string[] | "*"> {
  if (HIERARCHY_ROLES.has(user.role)) return "*";
  const ids = new Set<string>();
  const assignments = await getActiveAssignments(user.id);
  for (const a of assignments) ids.add(a.hospitalId);
  if (user.scope.hospitalId) {
    // Only trust the session scope when it matches an active assignment or
    // the user holds an administrative role over that hospital.
    if (
      roleHasPermission(user.role, "MANAGE_HOSPITAL") ||
      assignments.length === 0 // legacy accounts without assignment rows yet
    ) {
      ids.add(user.scope.hospitalId);
    }
  }
  if (ids.size === 0) return [];
  return [...ids];
}

/**
 * Assert the user may access a resource belonging to `hospitalId`.
 * Throws AccessDeniedError on cross-hospital access without authorization.
 */
export async function assertHospitalScope(
  user: SessionUser,
  hospitalId: string,
): Promise<void> {
  if (HIERARCHY_ROLES.has(user.role)) return;
  const allowed = await getAllowedHospitalIds(user);
  if (allowed === "*" || allowed.includes(hospitalId)) return;
  throw new AccessDeniedError(
    `FORBIDDEN: No access to hospital ${hospitalId} from your current assignment.`,
  );
}

/** requirePermission + hospital scope in one step. Returns the session. */
export async function requireHospitalAccess(
  permission: Permission,
  hospitalId: string,
): Promise<SessionUser> {
  const user = await requirePermission(permission);
  await assertHospitalScope(user, hospitalId);
  return user;
}

/** Department-level scope check: user must have an active assignment in the department (or be admin). */
export async function assertDepartmentScope(
  user: SessionUser,
  hospitalId: string,
  departmentId: string | null | undefined,
): Promise<void> {
  await assertHospitalScope(user, hospitalId);
  if (!departmentId) return;
  if (
    roleHasPermission(user.role, "MANAGE_HOSPITAL") ||
    HIERARCHY_ROLES.has(user.role)
  ) {
    return;
  }
  const assignments = await getActiveAssignments(user.id);
  const scoped = assignments.some(
    (a) => !a.departmentId || a.departmentId === departmentId,
  );
  if (!scoped) {
    throw new AccessDeniedError(
      `FORBIDDEN: No access to department ${departmentId}.`,
    );
  }
}

/** First active assignment for a user at a given hospital (or anywhere). */
export async function getPrimaryAssignment(
  userId: string,
  hospitalId?: string,
): Promise<StaffAssignment | null> {
  const query: Record<string, unknown> = { staffId: userId, status: "active" };
  if (hospitalId) query.hospitalId = hospitalId;
  const doc = await StaffAssignmentModel.findOne(query).sort({ createdAt: 1 }).lean();
  return doc ? plain<StaffAssignment>(doc) : null;
}
