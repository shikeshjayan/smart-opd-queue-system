import type { QueueEntry } from "@/types";
import { QueueItem } from "./QueueItem";

type QueueListProps = {
  entries: QueueEntry[];
  busy?: boolean;
  onCall?: (tokenNumber: string) => void;
  onSkip?: (tokenNumber: string) => void;
};

export function QueueList({ entries, busy = false, onCall, onSkip }: QueueListProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-ink-500">No patients waiting.</p>;
  }

  return (
    <ol aria-label="Waiting queue" className="flex flex-col gap-3">
      {entries.map((entry) => (
        <QueueItem
          key={entry.tokenNumber}
          entry={entry}
          busy={busy}
          onCall={onCall}
          onSkip={onSkip}
        />
      ))}
    </ol>
  );
}
