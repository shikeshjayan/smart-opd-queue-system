import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { PatientTestEntry } from "@/services/diagnostics/types";
import { EmptyState } from "@/components/feedback/empty-state";
import { testStatusLabel } from "./DiagnosticTimeline";

export function statusBadgeVariant(entry: PatientTestEntry): "success" | "info" | "default" | "warning" {
  if (entry.resultStatus === "final" || entry.resultStatus === "amended") return "success";
  if (entry.resultStatus === "preliminary") return "warning";
  if (entry.orderStatus === "processing" || entry.orderStatus === "sample_collected") return "info";
  return "default";
}

export function MyTests({ entries }: { entries: PatientTestEntry[] }) {
  const recent = entries.slice(0, 5);

  if (recent.length === 0) {
    return (
      <EmptyState title="No tests" description="Tests ordered at your visits will appear here." />
    );
  }

  return (
    <section aria-labelledby="my-tests-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="my-tests-title" className="text-lg font-semibold text-ink-900">
          My Tests
        </h2>
        <Link href="/patient/lab-reports" className="text-sm font-medium text-brand-700 hover:underline">
          View all
        </Link>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {recent.map((entry) => {
          const available = entry.resultId && (entry.resultStatus === "final" || entry.resultStatus === "amended");
          return (
            <li key={`${entry.orderId}-${entry.testId}`} className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-ink-200 bg-surface px-4 py-3 shadow-card">
              <div>
                <p className="text-sm font-medium text-ink-900">{entry.testName}</p>
                <p className="text-xs text-ink-500">{entry.orderId}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={statusBadgeVariant(entry)}>{testStatusLabel(entry)}</Badge>
                {available && (
                  <Link
                    href={`/patient/lab-reports/${entry.resultId}`}
                    className="rounded-btn border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
                  >
                    View Result
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}