"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useDistrictAdmin } from "@/features/government-admin/district-context";
import { useQueueMonitor } from "@/features/government-admin/hooks/useGovernmentAdmin";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { LiveIndicator } from "@/features/government-admin/components/LiveIndicator";
import { OpdStatusBadge } from "@/features/opd/components/OpdStatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";

export default function DistrictOpdActivityPage() {
  const { districtId } = useDistrictAdmin();
  const { data, isLoading, error, reload } = useQueueMonitor([districtId ?? "ernakulam"]);

  const totals = useMemo(() => {
    const rows = data ?? [];
    return {
      waiting: rows.reduce((sum, row) => sum + row.waiting, 0),
      completed: rows.reduce((sum, row) => sum + row.completed, 0),
      active: rows.filter((row) => row.status === "open" || row.status === "full").length,
    };
  }, [data]);

  if (isLoading || !districtId) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Unable to load OPD activity."} onRetry={reload} />;
  }

  const rows = data.filter((row) => row.status === "open" || row.status === "full");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="OPD Activity"
        description="Live activity across all open OPDs in the district."
        actions={<LiveIndicator />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-ink-500">Open OPDs</p>
            <p className="mt-1 text-3xl font-bold text-ink-900">{totals.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-ink-500">Waiting</p>
            <p className="mt-1 text-3xl font-bold text-ink-900">{totals.waiting}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-ink-500">Completed today</p>
            <p className="mt-1 text-3xl font-bold text-ink-900">{totals.completed}</p>
          </CardContent>
        </Card>
      </div>

      <div className="hidden md:block">
        <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted">
                <TableHead>Hospital</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>OPD</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Now Serving</TableHead>
                <TableHead className="text-right">Waiting</TableHead>
                <TableHead className="text-right">Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.opdId}>
                  <TableCell className="font-medium text-ink-900">
                    <Link
                      href={`/district-admin/hospitals/${row.hospitalId}`}
                      className="text-brand-600 hover:underline"
                    >
                      {row.hospitalName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-ink-700">{row.departmentName}</TableCell>
                  <TableCell className="text-ink-700">{row.opdName}</TableCell>
                  <TableCell>
                    <OpdStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="text-right text-ink-700">
                    {row.nowServing ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-ink-900">
                    {row.waiting}
                  </TableCell>
                  <TableCell className="text-right text-ink-700">{row.completed}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <li key={row.opdId} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/district-admin/hospitals/${row.hospitalId}`}
                  className="font-medium text-brand-600 hover:underline"
                >
                  {row.hospitalName}
                </Link>
                <p className="text-sm text-ink-500">
                  {row.departmentName} &middot; {row.opdName}
                </p>
              </div>
              <OpdStatusBadge status={row.status} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-700">
              <span>
                Serving <span className="font-semibold">{row.nowServing ?? "—"}</span>
              </span>
              <span>
                Waiting <span className="font-semibold">{row.waiting}</span>
                <span className="mx-1 text-ink-300">·</span>
                Completed <span className="font-semibold">{row.completed}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
