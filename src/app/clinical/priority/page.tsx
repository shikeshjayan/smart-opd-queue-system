"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAssessmentList, usePriorityAction } from "@/features/priority/hooks/usePriority";
import { PriorityAssessment } from "@/features/priority/components/PriorityAssessment";
import { PriorityBadge } from "@/features/priority/components/PriorityBadge";
import { PermissionGuard } from "@/features/auth/components/PermissionGuard";
import { DEFAULT_HOSPITAL_ID } from "@/config/app";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import type { AssessmentRow, PriorityLevel } from "@/features/priority/types/priority.types";

export default function ClinicalPriorityPage() {
  const { user } = useAuth();
  const hospitalId = user?.scope.hospitalId ?? DEFAULT_HOSPITAL_ID;

  const { data: rows, isLoading, error, reload } = useAssessmentList(hospitalId);
  const { assignPriority, isRunning, error: actionError } = usePriorityAction();

  const [target, setTarget] = useState<AssessmentRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleConfirm = useCallback(
    async (level: PriorityLevel, notes?: string) => {
      if (!target) return;
      await assignPriority({
        opdId: target.opdId,
        tokenNumber: target.tokenNumber,
        patientId: target.patientId,
        patientName: target.patientName,
        level,
        notes,
      });
      setDialogOpen(false);
      setTarget(null);
      reload();
    },
    [target, assignPriority, reload]
  );

  const summary = (rows ?? []).reduce(
    (acc, row) => {
      acc.total += 1;
      if (row.priority === "emergency") acc.emergency += 1;
      else if (row.priority === "priority") acc.priority += 1;
      else acc.normal += 1;
      return acc;
    },
    { total: 0, emergency: 0, priority: 0, normal: 0 }
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Priority Assessment</h1>
        <p className="mt-1 text-sm text-ink-500">
          Authorized clinical assessment of waiting patients.
        </p>
      </div>

      {actionError && (
        <p role="alert" className="rounded-card border border-status-danger-soft bg-status-danger-soft p-4 text-sm text-status-danger">
          {actionError}
        </p>
      )}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <dt className="text-xs text-ink-500">Waiting</dt>
          <dd className="mt-1 text-2xl font-bold tabular-nums text-ink-900">{summary.total}</dd>
        </div>
        <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <dt className="text-xs text-ink-500">Emergency</dt>
          <dd className="mt-1 text-2xl font-bold tabular-nums text-status-danger">{summary.emergency}</dd>
        </div>
        <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <dt className="text-xs text-ink-500">Priority</dt>
          <dd className="mt-1 text-2xl font-bold tabular-nums text-status-warning">{summary.priority}</dd>
        </div>
        <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <dt className="text-xs text-ink-500">Normal</dt>
          <dd className="mt-1 text-2xl font-bold tabular-nums text-ink-900">{summary.normal}</dd>
        </div>
      </dl>

      <section aria-labelledby="assessment-list-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <h2 id="assessment-list-title" className="text-lg font-semibold text-ink-900">
          Waiting Patients
        </h2>
        <p className="mt-0.5 text-sm text-ink-500">
          Order shown is the queue engine&apos;s authoritative order.
        </p>

        {isLoading ? (
          <div className="mt-4 flex flex-col gap-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : error ? (
          <div className="mt-4">
            <ErrorState message={error} onRetry={reload} />
          </div>
        ) : (rows ?? []).length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No waiting patients" description="All queues are clear." />
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {(rows ?? []).map((row) => (
              <li
                key={`${row.opdId}-${row.tokenNumber}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-ink-200 bg-surface px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums text-ink-400">#{row.position}</span>
                  <span className="text-lg font-semibold tabular-nums text-ink-900">
                    {row.tokenNumber}
                  </span>
                  <PriorityBadge priority={row.priority} />
                  <div>
                    <p className="text-sm font-medium text-ink-900">{row.patientName ?? "Unknown"}</p>
                    <p className="text-xs text-ink-500">
                      {row.opdName}
                      {row.patientId ? ` · ${row.patientId}` : ""}
                    </p>
                  </div>
                  {row.assessed ? (
                    <Badge variant="success">Assessed</Badge>
                  ) : (
                    <Badge variant="warning">Assessment required</Badge>
                  )}
                </div>
                <PermissionGuard permission="ASSESS_PRIORITY">
                  <button
                    type="button"
                    onClick={() => {
                      setTarget(row);
                      setDialogOpen(true);
                    }}
                    className="rounded-btn bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                    disabled={isRunning}
                  >
                    Assess
                  </button>
                </PermissionGuard>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PriorityAssessment
        key={target?.tokenNumber ?? "closed"}
        open={dialogOpen}
        row={target}
        busy={isRunning}
        onClose={() => {
          setDialogOpen(false);
          setTarget(null);
        }}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
