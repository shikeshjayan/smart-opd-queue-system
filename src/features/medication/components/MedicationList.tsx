import Link from "next/link";
import type { MedicationRegimenEntry } from "@/services/prescription/types";
import { EmptyState } from "@/components/feedback/empty-state";
import { ActiveMedicationCard } from "./ActiveMedicationCard";

type MedicationListProps = {
  entries: MedicationRegimenEntry[];
  historyHref?: string;
};

export function MedicationList({ entries, historyHref }: MedicationListProps) {
  const active = entries.filter((entry) => entry.status === "active");

  if (active.length === 0) {
    return (
      <EmptyState title="No active medications" description="Prescribed medications will appear here." />
    );
  }

  return (
    <section aria-labelledby="current-meds-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="current-meds-title" className="text-lg font-semibold text-ink-900">
          Current Medications
        </h2>
        {historyHref && (
          <Link href={historyHref} className="text-sm font-medium text-brand-700 hover:underline">
            View Medication History
          </Link>
        )}
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {active.map((entry) => (
          <ActiveMedicationCard key={entry.id} entry={entry} />
        ))}
      </ul>
    </section>
  );
}