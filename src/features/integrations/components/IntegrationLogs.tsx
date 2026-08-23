"use client";

import type { IntegrationEventRow } from "../types/integration.types";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";

const STATUS_VARIANT = {
  pending: "info",
  processing: "info",
  completed: "success",
  failed: "danger",
} as const;

type IntegrationLogsProps = {
  event: IntegrationEventRow | null;
  onClose: () => void;
};

export function IntegrationLogs({ event, onClose }: IntegrationLogsProps) {
  if (!event) return null;

  return (
    <Dialog open onClose={onClose} title="Integration Log" className="max-w-lg">
      <dl className="flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-ink-400">Status</dt>
          <dd>
            <Badge variant={STATUS_VARIANT[event.status]}>{event.status.toUpperCase()}</Badge>
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-ink-400">Provider</dt>
          <dd className="font-medium text-ink-900">{event.provider}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-ink-400">Type</dt>
          <dd className="text-ink-700">{event.type}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-ink-400">Resource</dt>
          <dd className="font-mono text-xs text-ink-700">{event.resourceId}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-ink-400">Attempts</dt>
          <dd className="tabular-nums text-ink-700">{event.attempts} / {event.maxAttempts}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-ink-400">Created</dt>
          <dd className="tabular-nums text-ink-700">
            {new Date(event.createdAt).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit",
            })}
          </dd>
        </div>
        {event.completedAt && (
          <div className="flex items-center justify-between">
            <dt className="text-ink-400">Completed</dt>
            <dd className="tabular-nums text-ink-700">
              {new Date(event.completedAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
              })}
            </dd>
          </div>
        )}
        {event.failedReason && (
          <div className="rounded-btn border border-status-danger-soft bg-status-danger-soft/30 p-3">
            <dt className="text-xs font-medium text-status-danger">Failure reason</dt>
            <dd className="mt-1 text-sm text-ink-700">{event.failedReason}</dd>
          </div>
        )}
        {event.nextRetryAt && (
          <div className="flex items-center justify-between">
            <dt className="text-ink-400">Next retry</dt>
            <dd className="tabular-nums text-ink-700">
              {new Date(event.nextRetryAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
            </dd>
          </div>
        )}
      </dl>
    </Dialog>
  );
}
