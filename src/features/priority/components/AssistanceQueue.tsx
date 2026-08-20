"use client";

import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/features/auth/components/PermissionGuard";
import { EmptyState } from "@/components/feedback/empty-state";
import { timeAgo } from "@/features/notifications/utils/format";
import type { AssistanceRequest, AssistanceStatus, AssistanceType } from "../types/priority.types";

const typeLabels: Record<AssistanceType, string> = {
  mobility: "Mobility",
  communication: "Communication",
  navigation: "Navigation",
  other: "Other",
};

const statusVariant: Record<AssistanceStatus, string> = {
  requested: "bg-status-info-soft text-status-info",
  assigned: "bg-status-warning-soft text-status-warning",
  in_progress: "bg-status-warning-soft text-status-warning",
  completed: "bg-status-success-soft text-status-success",
  cancelled: "bg-ink-100 text-ink-500",
};

type AssistanceQueueProps = {
  requests: AssistanceRequest[];
  busy?: boolean;
  onUpdate: (id: string, status: AssistanceStatus) => void;
};

export function AssistanceQueue({ requests, busy = false, onUpdate }: AssistanceQueueProps) {
  if (requests.length === 0) {
    return (
      <EmptyState
        title="No assistance requests"
        description="Patient assistance requests will appear here."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {requests.map((request) => (
        <li
          key={request.id}
          className="flex flex-wrap items-start justify-between gap-3 rounded-card border border-ink-200 bg-surface p-4 shadow-card"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-ink-900">{request.patientName}</p>
              <span className="text-xs text-ink-500">#{request.patientId}</span>
              <span className="text-xs text-ink-400">{request.id}</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusVariant[request.status]}`}
              >
                {request.status.replace("_", " ")}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-700">{typeLabels[request.type]} assistance</p>
            <p className="mt-0.5 text-xs text-ink-400">
              {timeAgo(request.createdAt)}
              {request.assignedTo ? ` · Assigned to ${request.assignedTo}` : ""}
            </p>
          </div>

          <PermissionGuard permission="MANAGE_ASSISTANCE">
            <div className="flex items-center gap-2">
              {request.status === "requested" && (
                <Button size="sm" disabled={busy} onClick={() => onUpdate(request.id, "assigned")}>
                  Assign
                </Button>
              )}
              {request.status === "assigned" && (
                <Button size="sm" disabled={busy} onClick={() => onUpdate(request.id, "in_progress")}>
                  Start
                </Button>
              )}
              {request.status === "in_progress" && (
                <Button size="sm" variant="primary" disabled={busy} onClick={() => onUpdate(request.id, "completed")}>
                  Complete
                </Button>
              )}
              {(request.status === "requested" || request.status === "assigned") && (
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => onUpdate(request.id, "cancelled")}>
                  Cancel
                </Button>
              )}
            </div>
          </PermissionGuard>
        </li>
      ))}
    </ul>
  );
}
