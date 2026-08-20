"use client";

import { useCallback } from "react";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { OverrideApprovalList } from "@/features/priority/components/OverrideApprovalList";
import { useOverrides, useOverrideActions } from "@/features/priority/hooks/usePriority";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";

export default function QueueOverridesPage() {
  const { data, isLoading, error, reload } = useOverrides();
  const { approve, reject, isRunning, error: actionError } = useOverrideActions();

  const handleApprove = useCallback(
    async (id: string) => {
      const result = await approve(id);
      if (result) reload();
    },
    [approve, reload]
  );

  const handleReject = useCallback(
    async (id: string) => {
      const result = await reject(id);
      if (result) reload();
    },
    [reject, reload]
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Queue Overrides"
        description="Approve or reject staff requests to move a token ahead in the queue. Every decision is recorded for audit."
      />

      {actionError && (
        <p role="alert" className="rounded-card border border-status-danger-soft bg-status-danger-soft p-4 text-sm text-status-danger">
          {actionError}
        </p>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <OverrideApprovalList
          requests={data ?? []}
          busy={isRunning}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
