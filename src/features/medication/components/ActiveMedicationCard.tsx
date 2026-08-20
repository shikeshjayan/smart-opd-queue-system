import type { MedicationRegimenEntry } from "@/services/prescription/types";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/features/medical-records/utils/format";

export function medicationStatusLabel(entry: MedicationRegimenEntry): string {
  if (entry.status === "discontinued") return "Discontinued";
  if (entry.status === "completed") return "Completed";
  return "Active";
}

export function ActiveMedicationCard({ entry }: { entry: MedicationRegimenEntry }) {
  const variant =
    entry.status === "active" ? "success" : entry.status === "discontinued" ? "danger" : "default";

  return (
    <li className="rounded-card border border-ink-200 bg-surface px-4 py-3 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink-900">{entry.genericName}</p>
        <Badge variant={variant}>{medicationStatusLabel(entry)}</Badge>
      </div>
      <p className="mt-1 text-xs text-ink-500">
        {entry.brandLabel ? `${entry.brandLabel} · ` : ""}
        {entry.dosage} · {entry.frequency}
      </p>
      <p className="mt-1 text-xs text-ink-400">
        {entry.status === "active"
          ? `Since ${formatDate(entry.startedAt.slice(0, 10))}`
          : entry.status === "discontinued"
            ? `Stopped ${formatDate((entry.discontinuedAt ?? "").slice(0, 10))}`
            : `Completed ${formatDate(entry.startedAt.slice(0, 10))}`}
        {entry.status === "active" && entry.expectedEndDate
          ? ` · until ${formatDate(entry.expectedEndDate)}`
          : ""}
        {entry.status === "discontinued" && entry.reason ? ` · ${entry.reason}` : ""}
      </p>
    </li>
  );
}