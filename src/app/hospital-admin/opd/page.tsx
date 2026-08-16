"use client";

import { useState } from "react";
import Link from "next/link";
import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import {
  useAdminDepartments,
  useAdminMutations,
  useQueueOverview,
} from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { OpdFormDialog } from "@/features/hospital-admin/components/OpdFormDialog";
import { StatusConfirmDialog } from "@/features/hospital-admin/components/StatusConfirmDialog";
import { HealthBadge } from "@/features/hospital-admin/components/HealthBadge";
import { OpdStatusBadge } from "@/features/opd/components/OpdStatusBadge";
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
import { formatTime } from "@/features/hospital-admin/utils/format";

export default function OpdPage() {
  const { hospitalId } = useHospitalAdmin();
  const { data: overview, isLoading, error, reload } = useQueueOverview(hospitalId);
  const { data: departments } = useAdminDepartments(hospitalId);
  const mutations = useAdminMutations();

  const [showAdd, setShowAdd] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    opdId: string;
    name: string;
    nextStatus: "open" | "closed";
  } | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !overview) {
    return <ErrorState message={error ?? "Unable to load OPD sessions."} onRetry={reload} />;
  }

  async function handleAdd(input: { departmentId: string; name: string; startTime: string; endTime: string }) {
    await mutations.addOpd(input);
    setShowAdd(false);
    reload();
  }

  async function handleConfirmToggle() {
    if (!confirmTarget) return;
    await mutations.setOpdStatus(confirmTarget.opdId, confirmTarget.nextStatus);
    setConfirmTarget(null);
    reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="OPD Sessions"
        description="Today's OPD sessions across departments."
        actions={
          <Button onClick={() => setShowAdd(true)} disabled={mutations.busy}>
            Add OPD Session
          </Button>
        }
      />

      {mutations.error && <p className="text-sm text-status-danger">{mutations.error}</p>}

      {overview.length === 0 ? (
        <EmptyState
          title="No OPD sessions"
          description="Add an OPD session to get started."
        />
      ) : (
        <div className="hidden md:block">
          <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-muted hover:bg-surface-muted">
                  <TableHead>OPD</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Timings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Now Serving</TableHead>
                  <TableHead className="text-right">Waiting</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.map((item) => (
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
                    <TableCell className="whitespace-nowrap text-ink-700">
                      {formatTime(item.startTime)} – {formatTime(item.endTime)}
                    </TableCell>
                    <TableCell>
                      <OpdStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-right text-ink-700">
                      {item.nowServing ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-ink-900">
                      {item.waiting}
                    </TableCell>
                    <TableCell>
                      <HealthBadge health={item.health} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/hospital-admin/opd/${item.opdId}`}
                          className="text-sm font-medium text-brand-600 hover:underline"
                        >
                          View
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setConfirmTarget({
                              opdId: item.opdId,
                              name: item.opdName,
                              nextStatus:
                                item.status === "open" || item.status === "full"
                                  ? "closed"
                                  : "open",
                            })
                          }
                          disabled={mutations.busy}
                        >
                          {item.status === "open" || item.status === "full" ? "Close" : "Open"}
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
        {overview.map((item) => (
          <li
            key={item.opdId}
            className="rounded-card border border-ink-200 bg-surface p-4 shadow-card"
          >
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
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setConfirmTarget({
                    opdId: item.opdId,
                    name: item.opdName,
                    nextStatus:
                      item.status === "open" || item.status === "full" ? "closed" : "open",
                  })
                }
                disabled={mutations.busy}
              >
                {item.status === "open" || item.status === "full" ? "Close" : "Open"}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <OpdFormDialog
        open={showAdd}
        busy={mutations.busy}
        error={mutations.error}
        departments={departments ?? []}
        onSubmit={handleAdd}
        onClose={() => setShowAdd(false)}
      />

      <StatusConfirmDialog
        open={confirmTarget !== null}
        title={`${confirmTarget?.nextStatus === "open" ? "Open" : "Close"} ${confirmTarget?.name ?? ""}?`}
        message={
          confirmTarget?.nextStatus === "closed"
            ? `Closing ${confirmTarget?.name} will stop new token issuance. Patients currently waiting can still be served.`
            : `Opening ${confirmTarget?.name} will allow patients to book tokens again.`
        }
        confirmLabel={confirmTarget?.nextStatus === "open" ? "Open" : "Close"}
        busy={mutations.busy}
        onConfirm={handleConfirmToggle}
        onClose={() => setConfirmTarget(null)}
      />
    </div>
  );
}
