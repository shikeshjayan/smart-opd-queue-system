"use client";

import { useState } from "react";
import Link from "next/link";
import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import {
  useAdminDepartments,
  useAdminMutations,
} from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { useQueueOverview } from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { DepartmentFormDialog } from "@/features/hospital-admin/components/DepartmentFormDialog";
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

export default function DepartmentsPage() {
  const { hospitalId } = useHospitalAdmin();
  const { data: departments, isLoading, error, reload } = useAdminDepartments(hospitalId);
  const { data: overview } = useQueueOverview(hospitalId);
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

  if (error || !departments) {
    return <ErrorState message={error ?? "Unable to load departments."} onRetry={reload} />;
  }

  const waitingFor = (departmentId: string) =>
    overview?.filter((o) => o.departmentId === departmentId).reduce((sum, o) => sum + o.waiting, 0) ?? 0;
  const opdsFor = (departmentId: string) =>
    overview?.filter((o) => o.departmentId === departmentId).length ?? 0;

  async function handleAdd(name: string) {
    await mutations.addDepartment(hospitalId, name);
    setShowAdd(false);
    reload();
  }

  async function handleConfirmToggle() {
    if (!confirmTarget) return;
    await mutations.setDepartmentStatus(confirmTarget.id, confirmTarget.nextStatus);
    setConfirmTarget(null);
    reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Departments"
        description="Manage clinical departments at this hospital."
        actions={
          <Button onClick={() => setShowAdd(true)} disabled={mutations.busy}>
            Add Department
          </Button>
        }
      />

      {mutations.error && <p className="text-sm text-status-danger">{mutations.error}</p>}

      {departments.length === 0 ? (
        <EmptyState
          title="No departments"
          description="Add your first department to get started."
        />
      ) : (
        <div className="hidden md:block">
          <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-muted hover:bg-surface-muted">
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Waiting</TableHead>
                  <TableHead className="text-right">OPD Sessions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium text-ink-900">
                      <Link
                        href={`/hospital-admin/departments/${department.id}`}
                        className="text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
                      >
                        {department.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={department.status === "active" ? "success" : "danger"}>
                        {department.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-ink-900">
                      {waitingFor(department.id)}
                    </TableCell>
                    <TableCell className="text-right text-ink-700">{opdsFor(department.id)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/hospital-admin/departments/${department.id}`}
                          className="text-sm font-medium text-brand-600 hover:underline"
                        >
                          View
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setConfirmTarget({
                              id: department.id,
                              name: department.name,
                              nextStatus: department.status === "active" ? "inactive" : "active",
                            })
                          }
                          disabled={mutations.busy}
                        >
                          {department.status === "active" ? "Deactivate" : "Activate"}
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
        {departments.map((department) => (
          <li
            key={department.id}
            className="rounded-card border border-ink-200 bg-surface p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/hospital-admin/departments/${department.id}`}
                  className="font-medium text-brand-600 hover:underline"
                >
                  {department.name}
                </Link>
                <p className="mt-0.5 text-sm text-ink-500">
                  {opdsFor(department.id)} OPDs · {waitingFor(department.id)} waiting
                </p>
              </div>
              <Badge variant={department.status === "active" ? "success" : "danger"}>
                {department.status}
              </Badge>
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setConfirmTarget({
                    id: department.id,
                    name: department.name,
                    nextStatus: department.status === "active" ? "inactive" : "active",
                  })
                }
                disabled={mutations.busy}
              >
                {department.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <DepartmentFormDialog
        open={showAdd}
        busy={mutations.busy}
        error={mutations.error}
        onSubmit={handleAdd}
        onClose={() => setShowAdd(false)}
      />

      <StatusConfirmDialog
        open={confirmTarget !== null}
        title={`${confirmTarget?.nextStatus === "active" ? "Activate" : "Deactivate"} ${confirmTarget?.name ?? ""}?`}
        message={
          confirmTarget?.nextStatus === "inactive"
            ? `Deactivating ${confirmTarget?.name} will hide it from patients. You can re-activate it anytime.`
            : `Re-activating ${confirmTarget?.name} will make it visible to patients again.`
        }
        confirmLabel={confirmTarget?.nextStatus === "active" ? "Activate" : "Deactivate"}
        busy={mutations.busy}
        onConfirm={handleConfirmToggle}
        onClose={() => setConfirmTarget(null)}
      />
    </div>
  );
}
