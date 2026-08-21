"use client";

import { useState } from "react";
import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import { useAdminDepartments } from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { useStaffProfiles } from "@/features/hospital-admin/hooks/useHospitalOps";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { StaffFormDialog } from "@/features/hospital-admin/components/StaffFormDialog";
import { RoleAssignmentPanel } from "@/features/hospital-admin/components/RoleAssignmentPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import type { StaffProfile } from "@/services/hospital-ops/types";

export default function StaffPage() {
  const { hospitalId, hospital } = useHospitalAdmin();
  const { data: departments } = useAdminDepartments(hospitalId);
  const {
    data: staff,
    isLoading,
    error,
    reload,
  } = useStaffProfiles(hospitalId);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffProfile | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !staff) {
    return <ErrorState message={error ?? "Unable to load staff."} onRetry={reload} />;
  }

  const departmentOptions = (departments ?? []).map((d) => ({ id: d.id, name: d.name }));
  const departmentName = (id?: string) =>
    id ? departmentOptions.find((d) => d.id === id)?.name ?? id : "—";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Staff"
        description="Staff profiles and role assignments for this hospital."
        actions={
          <Button
            onClick={() => {
              setEditTarget(null);
              setShowForm(true);
            }}
          >
            Add Staff
          </Button>
        }
      />

      {staff.length === 0 ? (
        <EmptyState title="No staff profiles" description="Add your first staff member." />
      ) : (
        <>
          <div className="hidden md:block">
            <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-muted hover:bg-surface-muted">
                    <TableHead>Name</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium text-ink-900">{member.name}</TableCell>
                      <TableCell className="font-mono text-xs text-ink-500">{member.employeeId}</TableCell>
                      <TableCell className="capitalize text-ink-700">{member.role.replace("_", " ")}</TableCell>
                      <TableCell className="text-ink-700">{departmentName(member.departmentId)}</TableCell>
                      <TableCell className="text-xs text-ink-500">
                        {member.phone}
                        {member.email ? ` · ${member.email}` : ""}
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.status === "active" ? "success" : "danger"}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditTarget(member);
                            setShowForm(true);
                          }}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {staff.map((member) => (
              <li key={member.id} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink-900">{member.name}</p>
                    <p className="font-mono text-xs text-ink-400">{member.employeeId}</p>
                  </div>
                  <Badge variant={member.status === "active" ? "success" : "danger"}>{member.status}</Badge>
                </div>
                <p className="mt-1 text-sm capitalize text-ink-500">
                  {member.role.replace("_", " ")} · {departmentName(member.departmentId)}
                </p>
                <p className="mt-0.5 text-xs text-ink-400">{member.phone}</p>
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditTarget(member);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <RoleAssignmentPanel
        hospitalId={hospitalId}
        hospitalName={hospital?.name ?? "Hospital"}
        departments={departmentOptions}
      />

      <StaffFormDialog
        open={showForm}
        hospitalId={hospitalId}
        departments={departmentOptions}
        profile={editTarget}
        onClose={() => setShowForm(false)}
        onSaved={reload}
      />
    </div>
  );
}
