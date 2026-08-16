import type { QueueEntry } from "@/types";

type QueueProgressProps = {
  entries: QueueEntry[];
  nowServing: string | null;
};

export function QueueProgress({ entries, nowServing }: QueueProgressProps) {
  return (
    <ol aria-label="Queue progress" className="divide-y divide-ink-100 rounded-card border border-ink-200 bg-surface">
      {entries.map((entry) => {
        const isNow = entry.tokenNumber === nowServing;
        const isYou = entry.isCurrentUser;
        return (
          <li
            key={entry.tokenNumber}
            className={`flex items-center justify-between gap-3 px-4 py-3 ${
              isNow ? "bg-brand-50" : isYou ? "bg-brand-100" : ""
            }`}
          >
            <span className="text-lg font-semibold tabular-nums text-ink-900">{entry.tokenNumber}</span>
            {isNow ? (
              <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-medium text-white">
                Now
              </span>
            ) : isYou ? (
              <span className="rounded-full bg-brand-700 px-2.5 py-0.5 text-xs font-medium text-white">
                You
              </span>
            ) : (
              <span className="text-xs text-ink-500">{entry.status.replace("_", " ")}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
