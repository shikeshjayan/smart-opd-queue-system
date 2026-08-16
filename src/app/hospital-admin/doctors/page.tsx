"use client";

import { useState } from "react";
import Link from "next/link";
import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import {
  useAdminDepartments,
  useAdminDoctors,
  useAdminMutations,
} from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { DoctorFormDialog } from "@/features/hospital-admin/components/DoctorFormDialog";
import { StatusConfirmDialog } from "@/features/hospital-admin/components/StatusConfirmDialog";
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
import { formatDate } from "@/features/hospital-admin/utils/format";

export default function DoctorsPage() {
  const { hospitalId } = useHospitalAdmin();
  const { data: doctors, isLoading, error, reload } = useAdminDoctors(hospitalId);
  const { data: departments } = useAdminDepartments(hospitalId);
  const mutations = useAdminMutations();

  const [showAdd, setShowAdd] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    id: string;
    name: string;
    nextStatus: "active" | "inactive";
  } | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !doctors) {
    return <ErrorState message={error ?? "Unable to load doctors."} onRetry={reload} />;
  }

  const departmentName = (departmentId: string) =>
    departments?.find((d) => d.id === departmentId)?.name ?? "—";

  async function handleAdd(input: {
    departmentId: string;
    name: string;
    speciality: string;
    phone: string;
    email: string;
  }) {
    await mutations.addDoctor({ ...input, hospitalId });
    setShowAdd(false);
    reload();
  }

  async function handleConfirmToggle() {
    if (!confirmTarget) return;
    await mutations.setDoctorStatus(confirmTarget.id, confirmTarget.nextStatus);
    setConfirmTarget(null);
    reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Doctors"
        description="Manage doctors assigned to this hospital."
        actions={
          <Button onClick={() => setShowAdd(true)} disabled={mutations.busy}>
            Add Doctor
          </Button>
        }
      />

      {mutations.error && <p className="text-sm text-status-danger">{mutations.error}</p>}

      {doctors.length === 0 ? (
        <EmptyState title="No doctors" description="Add your first doctor to get started." />
      ) : (
        <div className="hidden md:block">
          <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-muted hover:bg-surface-muted">
                  <TableHead>Doctor</TableHead>
                  <TableHead>Speciality</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell className="font-medium text-ink-900">
                      <Link
                        href={`/hospital-admin/doctors/${doctor.id}`}
                        className="text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
                      >
                        {doctor.name}
                      </Link>
                      <p className="text-xs text-ink-400">{doctor.email}</p>
                    </TableCell>
                    <TableCell className="text-ink-700">{doctor.speciality}</TableCell>
                    <TableCell className="text-ink-700">
                      {departmentName(doctor.departmentId)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={doctor.status === "active" ? "success" : "danger"}>
                        {doctor.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-ink-700">{formatDate(doctor.joinedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/hospital-admin/doctors/${doctor.id}`}
                          className="text-sm font-medium text-brand-600 hover:underline"
                        >
                          View
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setConfirmTarget({
                              id: doctor.id,
                              name: doctor.name,
                              nextStatus: doctor.status === "active" ? "inactive" : "active",
                            })
                          }
                          disabled={mutations.busy}
                        >
                          {doctor.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <ul className="flex flex-col gap-3 md:hidden">
        {doctors.map((doctor) => (
          <li
            key={doctor.id}
            className="rounded-card border border-ink-200 bg-surface p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/hospital-admin/doctors/${doctor.id}`}
                  className="font-medium text-brand-600 hover:underline"
                >
                  {doctor.name}
                </Link>
                <p className="text-sm text-ink-500">
                  {doctor.speciality} · {departmentName(doctor.departmentId)}
                </p>
              </div>
              <Badge variant={doctor.status === "active" ? "success" : "danger"}>
                {doctor.status}
              </Badge>
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setConfirmTarget({
                    id: doctor.id,
                    name: doctor.name,
                    nextStatus: doctor.status === "active" ? "inactive" : "active",
                  })
                }
                disabled={mutations.busy}
              >
                {doctor.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <DoctorFormDialog
        open={showAdd}
        busy={mutations.busy}
        error={mutations.error}
        departments={departments ?? []}
        onSubmit={handleAdd}
        onClose={() => setShowAdd(false)}
      />

      <StatusConfirmDialog
        open={confirmTarget !== null}
        title={`${confirmTarget?.nextStatus === "active" ? "Activate" : "Deactivate"} ${confirmTarget?.name ?? ""}?`}
        message={
          confirmTarget?.nextStatus === "inactive"
            ? `Deactivating ${confirmTarget?.name} will remove them from active duty. Their OPD sessions will show as unavailable.`
            : `Re-activating ${confirmTarget?.name} will restore their OPD sessions.`
        }
        confirmLabel={confirmTarget?.nextStatus === "active" ? "Activate" : "Deactivate"}
        busy={mutations.busy}
        onConfirm={handleConfirmToggle}
        onClose={() => setConfirmTarget(null)}
      />
    </div>
  );
}
