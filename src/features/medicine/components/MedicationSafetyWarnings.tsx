import { useAsync } from "@/lib/use-async";
import { medicineService } from "@/services/medicine";
import type { MedicineDose, SafetyWarning } from "@/services/medicine/types";
import { Skeleton } from "@/components/ui/skeleton";

type MedicationSafetyWarningsProps = {
  allergies: string[];
  doses: MedicineDose[];
};

function WarningRow({ warning }: { warning: SafetyWarning }) {
  const styles =
    warning.severity === "danger"
      ? "border-status-danger-soft bg-status-danger-soft text-status-danger"
      : warning.severity === "warning"
        ? "border-status-warning-soft bg-status-warning-soft text-status-warning"
        : "border-status-info-soft bg-status-info-soft text-status-info";
  return (
    <p className={`rounded-card border px-3 py-2 text-sm ${styles}`} role={warning.severity === "danger" ? "alert" : undefined}>
      <span className="mr-1 text-xs font-semibold uppercase tracking-wide">
        {warning.kind === "allergy"
          ? "Allergy alert"
          : warning.kind === "interaction"
            ? "Interaction"
            : "Dose check"}
        :
      </span>
      {warning.message}
    </p>
  );
}

export function MedicationSafetyWarnings({ allergies, doses }: MedicationSafetyWarningsProps) {
  const { data, isLoading } = useAsync(
    () => medicineService.safetyCheck(allergies, doses),
    [allergies.join(","), JSON.stringify(doses.map((d) => [d.medicineId, d.dosage, d.frequency]))]
  );

  if (doses.length === 0) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="rounded-card border border-status-success-soft bg-status-success-soft px-3 py-2 text-sm text-status-success">
        No safety concerns detected for the selected medicines.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {data.map((warning, index) => (
        <WarningRow key={`${warning.kind}-${index}`} warning={warning} />
      ))}
    </div>
  );
}