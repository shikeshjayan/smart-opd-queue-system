"use client";

import { useState } from "react";
import { hospitalOpsService } from "@/services/hospital-ops";
import type { DepartmentQueueConfig } from "@/services/hospital-ops/types";
import { useAsync } from "@/lib/use-async";
import { useOpsMutations } from "../hooks/useHospitalOps";
import { usePermissions } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";

function DepartmentQueueCard({
  initial,
  departmentName,
  editable,
}: {
  initial: DepartmentQueueConfig;
  departmentName: string;
  editable: boolean;
}) {
  const [draft, setDraft] = useState<DepartmentQueueConfig>(initial);
  const [saved, setSaved] = useState(false);
  const { saveQueueConfig, busy, error } = useOpsMutations();

  return (
    <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-ink-900">{departmentName}</h3>
        <label className="flex items-center gap-2 text-xs text-ink-500">
          Token prefix
          <input
            aria-label={`Token prefix for ${departmentName}`}
            className="h-9 w-16 rounded-btn border border-ink-300 px-2 text-center text-sm font-bold uppercase tabular-nums"
            maxLength={3}
            disabled={!editable}
            value={draft.tokenPrefix}
            onChange={(e) => {
              setDraft({ ...draft, tokenPrefix: e.target.value.toUpperCase() });
              setSaved(false);
            }}
          />
        </label>
      </div>
      <div className="mt-3 flex flex-col gap-2 text-sm text-ink-700">
        <label className="flex items-center justify-between gap-2">
          <span>Priority patients queue</span>
          <input
            type="checkbox"
            disabled={!editable}
            checked={draft.priorityEnabled}
            onChange={(e) => {
              setDraft({ ...draft, priorityEnabled: e.target.checked });
              setSaved(false);
            }}
          />
        </label>
        <label className="flex items-center justify-between gap-2">
          <span>Emergency as separate queue</span>
          <input
            type="checkbox"
            disabled={!editable}
            checked={draft.emergencySeparateQueue}
            onChange={(e) => {
              setDraft({ ...draft, emergencySeparateQueue: e.target.checked });
              setSaved(false);
            }}
          />
        </label>
      </div>
      {error && (
        <p className="mt-2 text-sm text-status-danger" role="alert">
          {error}
        </p>
      )}
      {editable && (
        <div className="mt-3 flex items-center gap-2 border-t border-ink-100 pt-3">
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() =>
              void (async () => {
                const result = await saveQueueConfig(draft);
                if (result) {
                  setDraft({ ...result });
                  setSaved(true);
                  setTimeout(() => setSaved(false), 2500);
                }
              })()
            }
          >
            Save
          </Button>
          {saved && <span className="text-xs text-status-success">Saved</span>}
        </div>
      )}
    </div>
  );
}

export function QueueSettingsForm({
  hospitalId,
  departments,
}: {
  hospitalId: string;
  departments: Array<{ id: string; name: string }>;
}) {
  const { data: configs, isLoading } = useAsync(
    () => hospitalOpsService.listQueueConfigs(hospitalId),
    [hospitalId]
  );
  const { can } = usePermissions();
  const editable = can("MANAGE_QUEUE_CONFIG");

  if (departments.length === 0) {
    return <EmptyState title="No departments" description="Add a department first." />;
  }
  if (isLoading || !configs) return <Skeleton className="h-64 w-full" />;

  const nameFor = (departmentId: string) =>
    departments.find((d) => d.id === departmentId)?.name ?? departmentId;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-500">
        Per-department token prefix and priority handling. Critical queue behaviour changes are restricted to
        authorized administrators.
      </p>
      {!editable && (
        <p className="text-sm text-status-warning">
          You don&apos;t have permission to change critical queue behaviour.
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {configs.map((config) => (
          <DepartmentQueueCard
            key={`${config.departmentId}:${config.tokenPrefix}`}
            initial={{ ...config }}
            departmentName={nameFor(config.departmentId)}
            editable={editable}
          />
        ))}
      </div>
    </div>
  );
}
