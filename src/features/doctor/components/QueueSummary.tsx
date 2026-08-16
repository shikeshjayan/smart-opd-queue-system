import Link from "next/link";
import type { QueueEntry } from "@/types";
import { QueueStatusBadge } from "@/features/queue/components/QueueStatusBadge";

type QueueSummaryProps = {
  entries: QueueEntry[];
};

export function QueueSummary({ entries }: QueueSummaryProps) {
  return (
    <section aria-labelledby="queue-summary-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
      <h2 id="queue-summary-title" className="text-lg font-semibold text-ink-900">
        Waiting Queue
      </h2>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-ink-500">No patients waiting.</p>
      ) : (
        <ol className="mt-3 divide-y divide-ink-100">
          {entries.map((entry) => (
            <li key={entry.tokenNumber} className="flex items-center justify-between py-2">
              <span className="font-medium tabular-nums text-ink-900">{entry.tokenNumber}</span>
              <span className="text-sm text-ink-500">{entry.patientName ?? "—"}</span>
              <QueueStatusBadge status={entry.status} />
            </li>
          ))}
        </ol>
      )}
      <Link
        href="/doctor/queue"
        className="mt-4 inline-flex h-10 items-center rounded-btn border border-brand-600 px-4 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-600"
      >
        Open Queue
      </Link>
    </section>
  );
}
