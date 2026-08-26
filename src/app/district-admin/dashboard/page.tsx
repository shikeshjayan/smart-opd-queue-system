"use client";

import { useDistrictAdmin } from "@/features/auth/context";
import { useDistrictDashboard } from "@/features/district-admin/hooks/useDistrictAdminData";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { LiveIndicator } from "@/features/government-admin/components/LiveIndicator";
import { StatGrid } from "@/features/government-admin/components/StatGrid";
import { AlertList } from "@/features/government-admin/components/AlertList";
import { HealthBadge } from "@/features/hospital-admin/components/HealthBadge";
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
import Link from "next/link";

export default function DistrictAdminDashboardPage() {
  const { admin, districtId } = useDistrictAdmin();
  const { data: dashboard, isLoading, error, reload } = useDistrictDashboard(
    districtId ?? "ernakulam"
  );

  if (isLoading || !districtId) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <ErrorState
        message={error ?? "Unable to load dashboard."}
        onRetry={reload}
      />
    );
  }

  const {
    performance,
    hospitals,
    alerts,
    longestQueue,
  } = dashboard;

  const stats = [
    { id: "hospitals", label: "Hospitals", value: hospitals.length },
    { id: "activeOpds", label: "Active OPDs", value: hospitals.reduce((s, h) => s + h.activeOpds, 0) },
    { id: "patients", label: "Patients Today", value: performance.totalPatients },
    { id: "waiting", label: "Currently Waiting", value: performance.totalWaiting, highlight: true },
    { id: "completed", label: "Completed", value: hospitals.reduce((s, h) => s + h.completed, 0) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${dashboard.districtName} District`}
        description={`${getGreeting()}, ${admin?.name ?? "Admin"} · ${admin?.email ?? ""}`}
        actions={<LiveIndicator />}
      />

      <StatGrid items={stats} />

      {longestQueue && (
        <div className="rounded-card border border-status-warning-soft bg-status-warning-soft p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-status-warning">
            Longest queue right now
          </p>
          <p className="mt-1 font-semibold text-ink-900">
            {longestQueue.name}
          </p>
          <p className="text-sm text-ink-700">
            {longestQueue.waiting} patients waiting. Consider opening additional OPD windows.
          </p>
        </div>
      )}

      <section aria-labelledby="hospital-queue-status-title">
        <h2 id="hospital-queue-status-title" className="mb-3 text-lg font-semibold text-ink-900">
          Hospital Queue Status
        </h2>
        <div className="hidden md:block">
          <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-muted hover:bg-surface-muted">
                  <TableHead>Hospital</TableHead>
                  <TableHead className="text-right">Waiting</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Active OPDs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hospitals.map((row) => (
                  <TableRow key={row.hospitalId}>
                    <TableCell className="font-medium text-ink-900">
                      <Link
                        href={`/district-admin/hospitals/${row.hospitalId}`}
                        className="text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
                      >
                        {row.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-ink-900">
                      {row.waiting}
                    </TableCell>
                    <TableCell>
                      <HealthBadge health={row.status === "alert" ? "critical" : row.status === "high_load" ? "warning" : "healthy"} />
                    </TableCell>
                    <TableCell className="text-right text-ink-700">{row.activeOpds}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <ul className="flex flex-col gap-3 md:hidden">
          {hospitals.map((row) => (
            <li
              key={row.hospitalId}
              className="rounded-card border border-ink-200 bg-surface p-4 shadow-card"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/district-admin/hospitals/${row.hospitalId}`}
                  className="font-medium text-brand-600 hover:underline"
                >
                  {row.name}
                </Link>
                <HealthBadge health={row.status === "alert" ? "critical" : row.status === "high_load" ? "warning" : "healthy"} />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-ink-700">
                <span>
                  Waiting <span className="font-semibold">{row.waiting}</span>
                </span>
                <span>{row.activeOpds} active OPDs</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-900">District Alerts</h2>
        <Link
          href="/district-admin/alerts"
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          View all alerts
        </Link>
      </div>
      <AlertList alerts={alerts as any} limit={4} />
    </div>
  );
}
