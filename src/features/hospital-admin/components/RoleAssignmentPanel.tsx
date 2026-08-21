"use client";

import { useState } from "react";
import type { AssignableUserRole, RoleAssignment } from "@/services/hospital-ops/types";
import { useOpsMutations, useRoleAssignments } from "../hooks/useHospitalOps";
import { usePermissions } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { inputCls, labelCls } from "@/features/consultation/utils/classes";

const ASSIGNABLE_ROLES: Array<{ value: AssignableUserRole; label: string }> = [
  { value: "doctor", label: "Doctor" },
  { value: "receptionist", label: "Receptionist" },
  { value: "clinical_staff", label: "Clinical Staff" },
  { value: "lab_staff", label: "Lab Staff" },
  { value: "hospital_admin", label: "Hospital Admin" },
];

function AssignDialog({
  open,
  onClose,
  hospitalId,
  departments,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  hospitalId: string;
  departments: Array<{ id: string; name: string }>;
  onSaved: () => void;
}) {
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [role, setRole] = useState<AssignableUserRole>("receptionist");
  const [departmentId, setDepartmentId] = useState("");
  const { assignRole, busy, error } = useOpsMutations();

  return (
    <Modal open={open} onClose={onClose} title="Assign Role">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void (async () => {
            const result = await assignRole(
              {
                userId: userId.trim(),
                userName: userName.trim() || userId.trim(),
                role,
                departmentId: departmentId || undefined,
              },
              hospitalId
            );
            if (result) {
              onSaved();
              onClose();
              setUserId("");
              setUserName("");
            }
          })();
        }}
        className="flex flex-col gap-3"
      >
        <label className="block">
          <span className={labelCls}>User ID</span>
          <input
            className={inputCls}
            required
            placeholder="e.g. stf_001"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </label>
        <label className="block">
          <span className={labelCls}>Display name</span>
          <input className={inputCls} value={userName} onChange={(e) => setUserName(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={labelCls}>Role</span>
            <select
              className={inputCls}
              value={role}
              onChange={(e) => setRole(e.target.value as AssignableUserRole)}
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Department</span>
            <select
              className={inputCls}
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="">— Hospital-wide —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-xs text-ink-500">
          Assignment scopes this user to {hospitalId === "" ? "this hospital" : "the selected hospital"}
          {departmentId ? ` · ${departments.find((d) => d.id === departmentId)?.name}` : " (hospital-wide)"}. A
          role never grants access to other hospitals.
        </p>
        {error && (
          <p className="text-sm text-status-danger" role="alert">
            {error}
          </p>
        )}
        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !userId.trim()}>
            {busy ? "Assigning..." : "Assign Role"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function RoleAssignmentPanel({
  hospitalId,
  hospitalName,
  departments,
}: {
  hospitalId: string;
  hospitalName: string;
  departments: Array<{ id: string; name: string }>;
}) {
  const { data: assignments, isLoading, reload } = useRoleAssignments(hospitalId);
  const [showAssign, setShowAssign] = useState(false);
  const { removeRoleAssignment, busy } = useOpsMutations();
  const { can } = usePermissions();
  const canAssign = can("ASSIGN_STAFF_ROLES");

  return (
    <section aria-labelledby="roles-title" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="roles-title" className="text-lg font-semibold text-ink-900">
          Role Assignment
        </h2>
        {canAssign && (
          <Button size="sm" onClick={() => setShowAssign(true)}>
            + Assign Role
          </Button>
        )}
      </div>
      <p className="text-sm text-ink-500">
        User → {hospitalName} → Department → Role. Access is scoped to this hospital only.
      </p>

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : !assignments || assignments.length === 0 ? (
        <EmptyState
          title="No role assignments"
          description="Assigned users will appear here."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {assignments.map((assignment: RoleAssignment) => (
            <li
              key={assignment.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-ink-200 bg-surface p-3 shadow-card"
            >
              <div>
                <p className="font-medium text-ink-900">{assignment.userName}</p>
                <p className="text-xs text-ink-500">
                  {assignment.departmentId
                    ? departments.find((d) => d.id === assignment.departmentId)?.name ?? assignment.departmentId
                    : "Hospital-wide"}{" "}
                  · assigned by {assignment.assignedBy}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="info">{assignment.role.replace(/_/g, " ")}</Badge>
                {canAssign && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={async () => {
                      await removeRoleAssignment(assignment.id);
                      reload();
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <AssignDialog
        open={showAssign}
        onClose={() => setShowAssign(false)}
        hospitalId={hospitalId}
        departments={departments}
        onSaved={reload}
      />
    </section>
  );
}
