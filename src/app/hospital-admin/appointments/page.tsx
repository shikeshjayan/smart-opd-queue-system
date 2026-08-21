"use client";

import { useMemo, useState } from "react";
import { useAsync } from "@/lib/use-async";
import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import { useAdminDepartments } from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { appointmentsMockApi } from "@/features/appointments/api/appointments.mock";
import type { AppointmentStatus } from "@/services/appointments/types";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
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

const STATUS_VARIANTS: Record<AppointmentStatus, "success" | "info" | "warning" | "danger" | "default"> = {
  scheduled: "info",
  confirmed: "success",
  checked_in: "warning",
  completed: "success",
  cancelled: "danger",
  no_show: "danger",
  rescheduled: "default",
};

export default function AppointmentsPage() {
  const { hospitalId } = useHospitalAdmin();
  const { data: departments } = useAdminDepartments(hospitalId);
  const {
    data: all,
    isLoading,
    error,
    reload,
  } = useAsync(() => appointmentsMockApi.listAll(), []);

  const [dateFilter, setDateFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">("");

  const rows = useMemo(() => {
    if (!all) return [];
    return all
      .filter((a) => a.hospitalId === hospitalId)
      .filter((a) => !dateFilter || a.scheduledDate === dateFilter)
      .filter((a) => !departmentFilter || a.departmentId === departmentFilter)
      .filter((a) => !statusFilter || a.status === statusFilter)
      .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));
  }, [all, hospitalId, dateFilter, departmentFilter, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !all) {
    return <ErrorState message={error ?? "Unable to load appointments."} onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Appointments"
        description="Hospital-wide appointment oversight. Booking and rescheduling happen at reception."
      />

      <div className="flex flex-wrap items-center gap-3 rounded-card border border-ink-200 bg-surface p-3 shadow-card">
        <label className="flex items-center gap-2 text-sm text-ink-500">
          Date
          <input
            type="date"
            className="h-10 rounded-btn border border-ink-300 bg-surface px-3 text-sm text-ink-900"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-500">
          Department
          <select
            className="h-10 rounded-btn border border-ink-300 bg-surface px-3 text-sm text-ink-900"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">All</option>
            {(departments ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-500">
          Status
          <select
            className="h-10 rounded-btn border border-ink-300 bg-surface px-3 text-sm text-ink-900"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | "")}
          >
            <option value="">All</option>
            {(Object.keys(STATUS_VARIANTS) as AppointmentStatus[]).map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <span className="ml-auto text-sm tabular-nums text-ink-500">{rows.length} appointments</span>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No appointments found" description="Adjust filters or wait for new bookings." />
      ) : (
        <>
          <div className="hidden md:block">
            <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-muted hover:bg-surface-muted">
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 100).map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="tabular-nums text-ink-700">
                        {new Date(`${appointment.scheduledDate}T00:00:00`).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </TableCell>
                      <TableCell className="tabular-nums text-ink-700">{appointment.scheduledTime ?? "—"}</TableCell>
                      <TableCell className="font-medium text-ink-900">
                        {(departments ?? []).find((d) => d.id === appointment.departmentId)?.name ??
                          appointment.departmentId}
                      </TableCell>
                      <TableCell className="capitalize text-ink-700">{appointment.type.replace("_", " ")}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[appointment.status]}>
                          {appointment.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {rows.length > 100 && (
              <p className="mt-2 text-xs text-ink-400">Showing first 100 of {rows.length}.</p>
            )}
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {rows.slice(0, 50).map((appointment) => (
              <li key={appointment.id} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-ink-900">
                    {(departments ?? []).find((d) => d.id === appointment.departmentId)?.name ??
                      appointment.departmentId}
                  </p>
                  <Badge variant={STATUS_VARIANTS[appointment.status]}>
                    {appointment.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="mt-1 text-sm capitalize text-ink-500">
                  {appointment.type.replace("_", " ")} ·{" "}
                  {new Date(`${appointment.scheduledDate}T00:00:00`).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  · {appointment.scheduledTime ?? "—"}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
