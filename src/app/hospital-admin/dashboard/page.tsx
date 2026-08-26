"use client";

import { useState } from "react";
import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import {
  DEFAULT_DASHBOARD_FILTERS,
  useOpsDashboard,
} from "@/features/hospital-admin/hooks/useHospitalOps";
import { useAdminDoctors } from "@/features/hospital-admin/hooks/useHospitalAdmin";
import type { DashboardFilters } from "@/services/hospital-ops/types";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { DashboardFiltersBar } from "@/features/hospital-admin/components/DashboardFiltersBar";
import { OperationalAlerts } from "@/features/hospital-admin/components/OperationalAlerts";
import { TodayOverview, OpsAlertFeed } from "@/features/hospital-admin/components/OpsLive";
import { getGreeting } from "@/features/hospital-admin/utils/format";
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

export default function HospitalAdminDashboardPage() {
  const { admin, hospital, hospitalId } = useHospitalAdmin();
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_DASHBOARD_FILTERS);
  const { data, isLoading, error, reload } = useOpsDashboard(hospitalId, filters);
  const { data: doctors } = useAdminDoctors(hospitalId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Unable to load dashboard."} onRetry={reload} />;
  }

  const overviewCards = [
    { id: "patients", label: "Patients Today", value: data.overview.patientsToday },
    { id: "appointments", label: "Appointments", value: data.overview.appointmentsToday },
    { id: "completed", label: "Completed OPD", value: data.overview.completedOpd },
    { id: "waiting", label: "Waiting", value: data.overview.waiting },
    { id: "emergency", label: "Emergency", value: data.overview.emergency },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${getGreeting()}, ${admin?.name ?? "Admin"}`}
        description={`Hospital Administration · ${hospital?.name ?? ""}`}
      />

      <DashboardFiltersBar
        filters={filters}
        onChange={setFilters}
        departments={data.departments.map((d) => ({ id: d.departmentId, name: d.departmentName }))}
        doctors={(doctors ?? []).map((d) => ({ id: d.id, name: d.name }))}
      />

      <section aria-labelledby="overview-title">
        <h2 id="overview-title" className="sr-only">
          Today&apos;s Overview
        </h2>
        <TodayOverview />
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {overviewCards.map((card) => (
            <div key={card.id} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
              <dt className="text-xs uppercase tracking-wide text-ink-400">{card.label}</dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums text-ink-900">{card.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="departments-title" className="rounded-card border border-ink-200 bg-surface shadow-card">
        <h2 id="departments-title" className="border-b border-ink-100 px-5 py-3.5 text-lg font-semibold text-ink-900">
          Departments
        </h2>
        {data.departments.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No departments" description="Add departments to see operational data." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted">
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Patients</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Waiting</TableHead>
                <TableHead className="text-right">Cancelled / No-show</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.departments.map((dept) => (
                <TableRow key={dept.departmentId}>
                  <TableCell className="font-medium text-ink-900">{dept.departmentName}</TableCell>
                  <TableCell className="text-right tabular-nums text-ink-700">{dept.patients}</TableCell>
                  <TableCell className="text-right tabular-nums text-status-success">{dept.completed}</TableCell>
                  <TableCell className="text-right tabular-nums text-ink-700">{dept.waiting}</TableCell>
                  <TableCell className="text-right tabular-nums text-ink-500">{dept.cancelled}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <OperationalAlerts alerts={data.alerts} />

      <OpsAlertFeed />

      <section aria-labelledby="workload-title" className="rounded-card border border-ink-200 bg-surface shadow-card">
        <h2 id="workload-title" className="border-b border-ink-100 px-5 py-3.5 text-lg font-semibold text-ink-900">
          Staff Workload
        </h2>
        {data.workload.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No doctors found" description="Doctor workload will appear here." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted">
                <TableHead>Doctor</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Patients</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Waiting</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.workload.map((row) => (
                <TableRow key={row.doctorId}>
                  <TableCell className="font-medium text-ink-900">{row.doctorName}</TableCell>
                  <TableCell className="text-ink-700">{row.departmentName}</TableCell>
                  <TableCell className="text-right tabular-nums text-ink-700">{row.patients}</TableCell>
                  <TableCell className="text-right tabular-nums text-status-success">{row.completed}</TableCell>
                  <TableCell className="text-right tabular-nums text-ink-700">{row.waiting}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
