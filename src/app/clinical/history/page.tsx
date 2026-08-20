"use client";

import { usePriorityAudit } from "@/features/priority/hooks/usePriority";
import { PriorityHistory } from "@/features/priority/components/PriorityHistory";
import { PermissionGuard } from "@/features/auth/components/PermissionGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";

export default function ClinicalHistoryPage() {
  const { data, isLoading, error, reload } = usePriorityAudit();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Priority Activity</h1>
        <p className="mt-1 text-sm text-ink-500">
          Audit-friendly record of priority changes and override decisions.
        </p>
      </div>

      <PermissionGuard
        permission="VIEW_PRIORITY_AUDIT"
        fallback={
          <p className="rounded-card border border-ink-200 bg-surface p-4 text-sm text-ink-500 shadow-card">
            Priority audit history is restricted to authorized administrators.
          </p>
        }
      >
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <PriorityHistory entries={data ?? []} />
        )}
      </PermissionGuard>
    </div>
  );
}
