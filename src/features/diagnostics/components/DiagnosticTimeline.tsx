import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { PatientTestEntry } from "@/services/diagnostics/types";
import { formatDate } from "@/features/medical-records/utils/format";

export function testStatusLabel(entry: PatientTestEntry): string {
  if (entry.resultStatus === "final" || entry.resultStatus === "amended") return "Result available";
  if (entry.resultStatus === "preliminary") return "Preliminary result";
  if (entry.orderStatus === "processing") return "Processing";
  if (entry.orderStatus === "sample_collected") return "Sample collected";
  if (entry.orderStatus === "ordered") return "Pending collection";
  return "Status unknown";
}

type DiagnosticTimelineProps = {
  entries: PatientTestEntry[];
  hrefFor?: (entry: PatientTestEntry) => string;
};

export function DiagnosticTimeline({ entries, hrefFor }: DiagnosticTimelineProps) {
  const grouped = new Map<string, PatientTestEntry[]>();
  for (const entry of entries) {
    const date = (entry.reportedAt ?? entry.orderedAt).slice(0, 10);
    const bucket = grouped.get(date) ?? [];
    bucket.push(entry);
    grouped.set(date, bucket);
  }
  const dates = [...grouped.keys()].sort((a, b) => b.localeCompare(a));

  if (dates.length === 0) return null;

  return (
    <ol className="flex flex-col gap-6">
      {dates.map((date) => (
        <li key={date}>
          <p className="text-sm font-semibold text-ink-900">{formatDate(date)}</p>
          <ul className="mt-2 flex flex-col gap-2">
            {grouped.get(date)!.map((entry) => {
              const available = entry.resultId && (entry.resultStatus === "final" || entry.resultStatus === "amended");
              const label = testStatusLabel(entry);
              const body = (
                <li className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-ink-200 bg-surface px-4 py-3 shadow-card">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{entry.testName}</p>
                    <p className="text-xs text-ink-500">{entry.orderId}</p>
                  </div>
                  <Badge variant={available ? "success" : entry.orderStatus === "processing" ? "info" : entry.orderStatus === "sample_collected" ? "info" : "default"}>
                    {label}
                  </Badge>
                </li>
              );
              if (available && hrefFor) {
                return (
                  <Link key={`${entry.orderId}-${entry.testId}`} href={hrefFor(entry)} className="block">
                    {body}
                  </Link>
                );
              }
              return <li key={`${entry.orderId}-${entry.testId}`}>{body}</li>;
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}