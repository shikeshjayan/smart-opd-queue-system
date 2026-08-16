"use client";

import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import { useAdminStaff } from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import type { StaffRole } from "@/types";
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
import { formatDate } from "@/features/hospital-admin/utils/format";

const roleLabels: Record<StaffRole, string> = {
  receptionist: "Receptionist",
  nurse: "Nurse",
  pharmacist: "Pharmacist",
  lab_technician: "Lab Technician",
  accountant: "Accountant",
  administrator: "Administrator",
};

export default function StaffPage() {
  const { hospitalId } = useHospitalAdmin();
  const { data: staff, isLoading, error, reload } = useAdminStaff(hospitalId);

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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Staff"
        description="Non-clinical staff working at this hospital."
      />

      {staff.length === 0 ? (
        <EmptyState title="No staff" description="No staff members are assigned to this hospital." />
      ) : (
        <div className="hidden md:block">
          <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-muted hover:bg-surface-muted">
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium text-ink-900">{member.name}</TableCell>
                    <TableCell className="text-ink-700">{roleLabels[member.role]}</TableCell>
                    <TableCell className="whitespace-nowrap text-ink-700">{member.phone}</TableCell>
                    <TableCell className="text-ink-700">{member.email}</TableCell>
                    <TableCell>
                      <Badge variant={member.status === "active" ? "success" : "danger"}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-ink-700">{formatDate(member.joinedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <ul className="flex flex-col gap-3 md:hidden">
        {staff.map((member) => (
          <li
            key={member.id}
            className="rounded-card border border-ink-200 bg-surface p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-ink-900">{member.name}</p>
                <p className="text-sm text-ink-500">{roleLabels[member.role]}</p>
              </div>
              <Badge variant={member.status === "active" ? "success" : "danger"}>
                {member.status}
              </Badge>
            </div>
            <div className="mt-2 text-sm text-ink-700">
              <p>{member.phone}</p>
              <p className="text-ink-500">{member.email}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
