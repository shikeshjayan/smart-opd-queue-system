"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import {
  useAdminDepartmentDetail,
  useAdminMutations,
} from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { StatusConfirmDialog } from "@/features/hospital-admin/components/StatusConfirmDialog";
import { OpdStatusBadge } from "@/features/opd/components/OpdStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { formatTime } from "@/features/hospital-admin/utils/format";

export default function DepartmentDetailPage() {
  const params = useParams<{ departmentId: string }>();
  const departmentId = params.departmentId;
  const { hospitalId, hospital } = useHospitalAdmin();
  const { data, isLoading, error, reload } = useAdminDepartmentDetail(hospitalId, departmentId);
  const mutations = useAdminMutations();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Department not found."} onRetry={reload} />;
  }

  const { department, opds, doctors, waiting } = data;

  async function handleConfirmToggle() {
    await mutations.setDepartmentStatus(
      department.id,
      department.status === "active" ? "inactive" : "active"
    );
    setConfirmOpen(false);
    reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/hospital-admin/departments"
          className="text-sm text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
        >
          &larr; Back to Departments
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-ink-900">{department.name}</h1>
            <p className="mt-1 text-sm text-ink-500">{hospital?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={department.status === "active" ? "success" : "danger"}>
              {department.status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={mutations.busy}
            >
              {department.status === "active" ? "Deactivate" : "Activate"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <p className="text-xs text-ink-500">OPD Sessions</p>
          <p className="mt-1 text-2xl font-bold text-ink-900">{opds.length}</p>
        </div>
        <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <p className="text-xs text-ink-500">Doctors</p>
          <p className="mt-1 text-2xl font-bold text-ink-900">{doctors.length}</p>
        </div>
        <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <p className="text-xs text-ink-500">Waiting now</p>
          <p className="mt-1 text-2xl font-bold text-ink-900">{waiting}</p>
        </div>
        <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <p className="text-xs text-ink-500">Department ID</p>
          <p className="mt-1 truncate font-mono text-lg font-semibold text-ink-900">
            {department.id}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>OPD Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {opds.length === 0 ? (
            <p className="text-sm text-ink-500">No OPD sessions in this department.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {opds.map((opd) => (
                <li
                  key={opd.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-token border border-ink-200 p-3"
                >
                  <div>
                    <Link
                      href={`/hospital-admin/opd/${opd.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {opd.name}
                    </Link>
                    <p className="text-sm text-ink-500">
                      {formatTime(opd.startTime)} – {formatTime(opd.endTime)}
                    </p>
                  </div>
                  <OpdStatusBadge status={opd.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Doctors</CardTitle>
        </CardHeader>
        <CardContent>
          {doctors.length === 0 ? (
            <p className="text-sm text-ink-500">No doctors assigned to this department.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {doctors.map((doctor) => (
                <li
                  key={doctor.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-token border border-ink-200 p-3"
                >
                  <div>
                    <Link
                      href={`/hospital-admin/doctors/${doctor.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {doctor.name}
                    </Link>
                    <p className="text-sm text-ink-500">{doctor.speciality}</p>
                  </div>
                  <Badge variant={doctor.status === "active" ? "success" : "danger"}>
                    {doctor.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <StatusConfirmDialog
        open={confirmOpen}
        title={`${department.status === "active" ? "Deactivate" : "Activate"} ${department.name}?`}
        message={
          department.status === "active"
            ? `Deactivating ${department.name} will hide it and its OPDs from patients. You can re-activate it anytime.`
            : `Re-activating ${department.name} will make it visible to patients again.`
        }
        confirmLabel={department.status === "active" ? "Deactivate" : "Activate"}
        busy={mutations.busy}
        onConfirm={handleConfirmToggle}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
