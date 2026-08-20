import type { PriorityAuditEntry, PriorityAuditAction } from "../types/priority.types";
import { timeAgo } from "@/features/notifications/utils/format";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/empty-state";

const actionConfig: Record<PriorityAuditAction, { label: string; variant: "success" | "warning" | "danger" | "info" | "default" }> = {
  priority_changed: { label: "Priority changed", variant: "warning" },
  override_requested: { label: "Override requested", variant: "info" },
  override_approved: { label: "Override approved", variant: "success" },
  override_rejected: { label: "Override rejected", variant: "danger" },
};

type PriorityHistoryProps = {
  entries: PriorityAuditEntry[];
};

export function PriorityHistory({ entries }: PriorityHistoryProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="No priority activity"
        description="Priority changes and override decisions will appear here."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => {
        const { label, variant } = actionConfig[entry.action];
        return (
          <li
            key={entry.id}
            className="rounded-card border border-ink-200 bg-surface p-4 shadow-card"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={variant}>{label}</Badge>
              <span className="font-mono font-semibold tabular-nums text-ink-900">
                {entry.tokenNumber}
              </span>
              {entry.patientName && (
                <span className="text-sm text-ink-500">{entry.patientName}</span>
              )}
            </div>
            {entry.action === "priority_changed" && (
              <p className="mt-1.5 text-sm text-ink-700">
                Previous: <span className="font-medium">{entry.previous ?? "normal"}</span> &rarr;{" "}
                New: <span className="font-medium">{entry.current}</span>
              </p>
            )}
            {entry.note && <p className="mt-1 text-sm text-ink-500">{entry.note}</p>}
            <p className="mt-1 text-xs text-ink-400">
              Changed by: <span className="font-medium text-ink-700">{entry.by}</span> ·{" "}
              {timeAgo(entry.at)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
