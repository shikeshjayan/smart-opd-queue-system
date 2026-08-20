"use client";

import { useCallback } from "react";
import { useAssistance } from "@/features/priority/hooks/usePriority";
import { AssistanceQueue } from "@/features/priority/components/AssistanceQueue";
import type { AssistanceStatus } from "@/features/priority/types/priority.types";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";

export default function ClinicalAssistancePage() {
  const { data, isLoading, error, reload, updateStatus, isRunning, actionError } = useAssistance();

  const handleUpdate = useCallback(
    async (id: string, status: AssistanceStatus) => {
      const result = await updateStatus(id, status);
      if (result) reload();
    },
    [updateStatus, reload]
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Assistance Requests</h1>
        <p className="mt-1 text-sm text-ink-500">
          Patient assistance requests — a separate workflow from clinical priority.
        </p>
      </div>

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
        <AssistanceQueue requests={data ?? []} busy={isRunning} onUpdate={handleUpdate} />
      )}
    </div>
  );
}
