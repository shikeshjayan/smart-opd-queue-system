"use client";

import Link from "next/link";
import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import { useQueueOverview } from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { HealthBadge } from "@/features/hospital-admin/components/HealthBadge";
import { OpdStatusBadge } from "@/features/opd/components/OpdStatusBadge";
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

export default function QueuesPage() {
  const { hospitalId } = useHospitalAdmin();
  const { data: items, isLoading, error, reload } = useQueueOverview(hospitalId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !items) {
    return <ErrorState message={error ?? "Unable to load queues."} onRetry={reload} />;
  }

  const critical = items.filter((item) => item.health === "critical").length;
  const warning = items.filter((item) => item.health === "warning").length;
  const healthy = items.filter((item) => item.health === "healthy").length;
  const totalWaiting = items.reduce((sum, item) => sum + item.waiting, 0);

  const summary = [
    { id: "total", label: "Total Waiting", value: totalWaiting, className: "text-ink-900" },
    { id: "critical", label: "Critical", value: critical, className: "text-status-danger" },
    { id: "warning", label: "High Wait", value: warning, className: "text-status-warning" },
    { id: "healthy", label: "Healthy", value: healthy, className: "text-status-success" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Queues"
        description="Live queue health across all OPD sessions."
      />

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summary.map((item) => (
          <div key={item.id} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
            <dt className="text-xs text-ink-500">{item.label}</dt>
            <dd className={`mt-1 text-3xl font-bold ${item.className}`}>{item.value}</dd>
          </div>
        ))}
      </dl>

      {items.length === 0 ? (
        <EmptyState title="No OPD queues" description="No OPD sessions have queues right now." />
      ) : (
        <div className="hidden md:block">
          <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-muted hover:bg-surface-muted">
                  <TableHead>OPD</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Now Serving</TableHead>
                  <TableHead className="text-right">Waiting</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead>Health</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.opdId}>
                    <TableCell className="font-medium text-ink-900">
                      <Link
                        href={`/hospital-admin/opd/${item.opdId}`}
                        className="text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
                      >
                        {item.opdName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-ink-700">{item.departmentName}</TableCell>
                    <TableCell>
                      <OpdStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-right text-ink-700">
                      {item.nowServing ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-ink-900">
                      {item.waiting}
                    </TableCell>
                    <TableCell className="text-right text-ink-700">{item.completed}</TableCell>
                    <TableCell>
                      <HealthBadge health={item.health} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <ul className="flex flex-col gap-3 md:hidden">
        {items.map((item) => (
          <li key={item.opdId} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/hospital-admin/opd/${item.opdId}`}
                  className="font-medium text-brand-600 hover:underline"
                >
                  {item.opdName}
                </Link>
                <p className="text-sm text-ink-500">{item.departmentName}</p>
              </div>
              <HealthBadge health={item.health} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-700">
              <OpdStatusBadge status={item.status} />
              <span>
                Serving <span className="font-semibold">{item.nowServing ?? "—"}</span>
                <span className="mx-1 text-ink-300">·</span>
                Waiting <span className="font-semibold">{item.waiting}</span>
                <span className="mx-1 text-ink-300">·</span>
                Done <span className="font-semibold">{item.completed}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
