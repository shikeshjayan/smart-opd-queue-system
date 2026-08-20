"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PermissionGuard } from "@/features/auth/components/PermissionGuard";
import { EmptyState } from "@/components/feedback/empty-state";
import { timeAgo } from "@/features/notifications/utils/format";
import { PriorityBadge } from "./PriorityBadge";
import type { QueueOverrideRequest } from "../types/priority.types";

const statusConfig: Record<QueueOverrideRequest["status"], { label: string; variant: "success" | "warning" | "danger" | "info" | "default" }> = {
  pending: { label: "Pending", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
  cancelled: { label: "Cancelled", variant: "default" },
};

type OverrideApprovalListProps = {
  requests: QueueOverrideRequest[];
  busy?: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
};

export function OverrideApprovalList({ requests, busy = false, onApprove, onReject }: OverrideApprovalListProps) {
  if (requests.length === 0) {
    return (
      <EmptyState
        title="No override requests"
        description="Queue override requests from staff will appear here for approval."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {requests.map((request) => {
        const { label, variant } = statusConfig[request.status];
        return (
          <li
            key={request.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-card border border-ink-200 bg-surface p-4 shadow-card"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-semibold tabular-nums text-ink-900">
                  {request.tokenNumber}
                </span>
                {request.patientName && (
                  <span className="text-sm text-ink-500">{request.patientName}</span>
                )}
                <PriorityBadge priority="priority" />
                <Badge variant={variant}>{label}</Badge>
              </div>
              <p className="mt-1 text-sm text-ink-700">Reason: {request.reason}</p>
              <p className="mt-1 text-xs text-ink-400">
                Requested by {request.requestedBy} · {timeAgo(request.createdAt)}
              </p>
              {request.reviewedBy && (
                <p className="mt-0.5 text-xs text-ink-400">
                  Reviewed by {request.reviewedBy} · {request.reviewedAt ? timeAgo(request.reviewedAt) : ""}
                </p>
              )}
            </div>

            {request.status === "pending" && (
              <PermissionGuard permission="APPROVE_OVERRIDE">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={busy}
                    onClick={() => onApprove(request.id)}
                  >
                    Approve
                  </Button>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => onReject(request.id)}>
                    Reject
                  </Button>
                </div>
              </PermissionGuard>
            )}
          </li>
        );
      })}
    </ul>
  );
}
