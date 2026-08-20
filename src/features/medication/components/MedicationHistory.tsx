import { useMemo, useState } from "react";
import { useMedications } from "../hooks/useMedications";
import type { MedicationPhase } from "../types/medication.types";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ActiveMedicationCard } from "./ActiveMedicationCard";
import { formatLongDate } from "@/features/medical-records/utils/format";

type MedicationHistoryProps = {
  patientId: string;
};

const PHASES: Array<{ value: MedicationPhase; label: string }> = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "discontinued", label: "Discontinued" },
  { value: "all", label: "All" },
];

export function MedicationHistory({ patientId }: MedicationHistoryProps) {
  const { data, isLoading, error, reload } = useMedications(patientId);
  const [phase, setPhase] = useState<MedicationPhase>("active");

  const list = useMemo(() => {
    const entries = data ?? [];
    return entries.filter((entry) => {
      if (phase === "active") return entry.status === "active";
      if (phase === "completed") return entry.status === "completed";
      if (phase === "discontinued") return entry.status === "discontinued";
      return true;
    });
  }, [data, phase]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof list>();
    for (const entry of list) {
      const date = entry.startedAt.slice(0, 10);
      const bucket = map.get(date) ?? [];
      bucket.push(entry);
      map.set(date, bucket);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [list]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;

  const counts = {
    active: (data ?? []).filter((e) => e.status === "active").length,
    completed: (data ?? []).filter((e) => e.status === "completed").length,
    discontinued: (data ?? []).filter((e) => e.status === "discontinued").length,
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {PHASES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={phase === value}
            onClick={() => setPhase(value)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              phase === value
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-ink-300 text-ink-600 hover:bg-ink-100"
            }`}
          >
            {label}
            {value !== "all" && counts[value] > 0 ? ` (${counts[value]})` : ""}
          </button>
        ))}
      </div>

      {(data ?? []).length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No medication history" description="Prescribed medications will appear here." />
        </div>
      ) : groups.length === 0 ? (
        <p className="mt-4 text-sm text-ink-500">No medications in this phase.</p>
      ) : (
        <ol className="mt-4 flex flex-col gap-6">
          {groups.map(([date, entries]) => (
            <li key={date}>
              <p className="text-sm font-semibold text-ink-900">
                {formatLongDate(date)}
              </p>
              <ul className="mt-2 flex flex-col gap-2">
                {entries.map((entry) => (
                  <ActiveMedicationCard key={entry.id} entry={entry} />
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}