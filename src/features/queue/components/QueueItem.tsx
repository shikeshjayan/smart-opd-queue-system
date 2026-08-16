import type { QueueEntry, QueueStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { QueueStatusBadge } from "./QueueStatusBadge";

type QueueItemProps = {
  entry: QueueEntry;
  busy?: boolean;
  onCall?: (tokenNumber: string) => void;
  onSkip?: (tokenNumber: string) => void;
};

export function QueueItem({ entry, busy = false, onCall, onSkip }: QueueItemProps) {
  const status = entry.status as QueueStatus;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-ink-200 bg-surface px-4 py-3 shadow-card">
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold tabular-nums text-ink-900">{entry.tokenNumber}</span>
        <div>
          <p className="text-sm font-medium text-ink-900">{entry.patientName ?? "—"}</p>
          {entry.patientId && (
            <p className="text-xs text-ink-500">Patient #{entry.patientId}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <QueueStatusBadge status={status} />
        {status === "waiting" && (
          <>
            <Button size="sm" variant="primary" disabled={busy} onClick={() => onCall?.(entry.tokenNumber)}>
              Call
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => onSkip?.(entry.tokenNumber)}>
              Skip
            </Button>
          </>
        )}
        {status === "called" && (
          <Button size="sm" variant="primary" disabled={busy} onClick={() => onCall?.(entry.tokenNumber)}>
            Start Consultation
          </Button>
        )}
      </div>
    </li>
  );
}
