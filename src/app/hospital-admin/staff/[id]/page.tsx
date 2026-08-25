"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import { useAdminDepartments } from "@/features/hospital-admin/hooks/useHospitalAdmin";
import {
  useOpsStaff,
  useOpsStaffAssignments,
  useStaffOpsMutations,
} from "@/features/hospital-admin/hooks/useHospitalOps";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { inputCls, labelCls } from "@/features/consultation/utils/classes";
import { usePermissions } from "@/features/auth/hooks/useAuth";

const ASSIGNMENT_ROLES = [
  "doctor",
  "nurse",
  "lab_technician",
  "lab_reviewer",
  "radiology_staff",
  "pharmacist",
  "receptionist",
  "data_entry_operator",
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { hospitalId } = useHospitalAdmin();
  const { data: departments } = useAdminDepartments(hospitalId);
  const { data: staff, isLoading } = useOpsStaff(hospitalId);
  const {
    data: assignments,
    isLoading: asgLoading,
    reload,
  } = useOpsStaffAssignments(id);
  const mutations = useStaffOpsMutations();
  const { can } = usePermissions();
  const canManage = can("MANAGE_STAFF");
  const [showAssign, setShowAssign] = useState(false);

  if (isLoading || asgLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const member = staff?.find((s) => s.id === id);
  const departmentName = (deptId?: string | null) =>
    deptId ? departments?.find((d) => d.id === deptId)?.name ?? deptId : "—";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={member?.name ?? "Staff"}
        description={`${member ? member.role.replace("_", " ") : ""} · ${departmentName(member?.departmentId)}${member?.phone ? ` · ${member.phone}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/hospital-admin/staff"
              className="rounded-btn border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-surface-muted"
            >
              Back to Staff
            </Link>
            {canManage && (
              <Button onClick={() => setShowAssign(true)} disabled={mutations.busy}>
                Assign
              </Button>
            )}
          </div>
        }
      />

      {member && (
        <div className="flex flex-wrap items-center gap-3 rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <span className="text-sm text-ink-500">Operational status:</span>
          {member.operationalStatus === "on_leave" && <Badge variant="warning">● On Leave</Badge>}
          {member.operationalStatus === "active" && <Badge variant="success">● Active</Badge>}
          {member.operationalStatus === "offline" && <Badge variant="default">● Offline</Badge>}
        </div>
      )}

      {mutations.error && (
        <p className="text-sm text-status-danger" role="alert">
          {mutations.error}
        </p>
      )}

      {!assignments || assignments.length === 0 ? (
        <EmptyState title="No assignments" description="This staff member has no department assignments yet." />
      ) : (
        <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted">
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="capitalize text-ink-900">{a.role.replace("_", " ")}</TableCell>
                  <TableCell className="text-ink-700">{a.departmentId ? departmentName(a.departmentId) : "—"}</TableCell>
                  <TableCell className="text-ink-700">{a.startDate}</TableCell>
                  <TableCell className="text-ink-700">{a.endDate ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={a.status === "active" ? "success" : "danger"}>{a.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage && a.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={mutations.busy}
                        onClick={async () => {
                          await mutations.endAssignment(a.id);
                          reload();
                        }}
                      >
                        End Assignment
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Modal open={showAssign} onClose={() => setShowAssign(false)} title="New Assignment">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void (async () => {
              const form = new FormData(e.currentTarget);
              const result = await mutations.createAssignment({
                hospitalId,
                staffId: id,
                departmentId: (form.get("departmentId") as string) || null,
                role: form.get("role") as string,
                startDate: form.get("startDate") as string,
              });
              if (result) {
                setShowAssign(false);
                reload();
              }
            })();
          }}
          className="flex flex-col gap-3"
        >
          <label className="block">
            <span className={labelCls}>Role</span>
            <select className={inputCls} name="role" required defaultValue="nurse">
              {ASSIGNMENT_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Department</span>
            <select className={inputCls} name="departmentId" defaultValue="">
              <option value="">— Hospital-wide —</option>
              {(departments ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Start date</span>
            <input className={inputCls} type="date" name="startDate" required defaultValue={todayISO()} />
          </label>

          {mutations.error && <p className="text-sm text-status-danger">{mutations.error}</p>}
          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowAssign(false)} disabled={mutations.busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutations.busy}>
              {mutations.busy ? "Saving..." : "Create Assignment"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
