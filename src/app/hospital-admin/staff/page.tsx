"use client";

import Link from "next/link";
import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import { useAdminDepartments } from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { useOpsStaff } from "@/features/hospital-admin/hooks/useHospitalOps";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { RoleAssignmentPanel } from "@/features/hospital-admin/components/RoleAssignmentPanel";
import { Badge } from "@/components/ui/badge";
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
import type { StaffOperationalStatus } from "@/server/actions/staff-ops";

function OpsStatusBadge({ status }: { status: StaffOperationalStatus }) {
  if (status === "on_leave") return <Badge variant="warning">● On Leave</Badge>;
  if (status === "active") return <Badge variant="success">● Active</Badge>;
  return <Badge variant="default">● Offline</Badge>;
}

export default function StaffPage() {
  const { hospitalId, hospital } = useHospitalAdmin();
  const { data: departments } = useAdminDepartments(hospitalId);
  const {
    data: staff,
    isLoading,
    error,
    reload,
  } = useOpsStaff(hospitalId);

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
  const departmentName = (id?: string | null) =>
    id ? departmentOptions.find((d) => d.id === id)?.name ?? id : "—";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Staff"
        description="Staff directory, assignments and operational status for this hospital."
        actions={
          <Link
            href="/hospital-admin/staff/leave"
            className="rounded-btn border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-surface-muted"
          >
            Leave Management
          </Link>
        }
      />

      {staff.length === 0 ? (
        <EmptyState title="No staff found" description="Staff appear here once assigned to this hospital." />
      ) : (
        <>
          <div className="hidden md:block">
            <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-muted hover:bg-surface-muted">
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Assignments</TableHead>
                    <TableHead>Operational Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium text-ink-900">
                        <Link
                          href={`/hospital-admin/staff/${member.id}`}
                          className="text-brand-600 hover:underline"
                        >
                          {member.name}
                        </Link>
                      </TableCell>
                      <TableCell className="capitalize text-ink-700">
                        {member.role.replace("_", " ")}
                      </TableCell>
                      <TableCell className="text-ink-700">{departmentName(member.departmentId)}</TableCell>
                      <TableCell className="text-xs text-ink-500">
                        {member.phone}
                        {member.email ? ` · ${member.email}` : ""}
                      </TableCell>
                      <TableCell className="text-center text-ink-700">{member.activeAssignmentCount}</TableCell>
                      <TableCell>
                        <OpsStatusBadge status={member.operationalStatus} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/hospital-admin/staff/${member.id}`}
                          className="text-sm font-medium text-brand-600 hover:underline"
                        >
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {staff.map((member) => (
              <li
                key={member.id}
                className="rounded-card border border-ink-200 bg-surface p-4 shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/hospital-admin/staff/${member.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {member.name}
                    </Link>
                    <p className="mt-0.5 text-sm capitalize text-ink-500">
                      {member.role.replace("_", " ")} · {departmentName(member.departmentId)}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-400">{member.phone}</p>
                  </div>
                  <OpsStatusBadge status={member.operationalStatus} />
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
    </div>
  );
}
