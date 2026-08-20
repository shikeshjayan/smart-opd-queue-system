import type { Allergy } from "@/features/medical-records/types/medical-record.types";

type AllergyWarningProps = {
  allergies: Allergy[];
  conflict?: string | null;
};

export function AllergyWarning({ allergies, conflict }: AllergyWarningProps) {
  const active = allergies.filter((allergy) => allergy.status !== "inactive");

  if (active.length === 0 && !conflict) return null;

  return (
    <div className="flex flex-col gap-2">
      {active.length > 0 && (
        <div className="rounded-card border border-status-warning-soft bg-status-warning-soft px-4 py-3">
          <p className="text-sm font-semibold text-status-warning">⚠ Allergies</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {active.map((allergy) => (
              <li
                key={allergy.id}
                className="rounded-full bg-status-warning-soft px-3 py-1 text-xs font-medium text-status-warning"
              >
                {allergy.substance}
                {allergy.severity ? ` (${allergy.severity})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
      {conflict && (
        <p className="rounded-card border border-status-danger-soft bg-status-danger-soft px-4 py-3 text-sm text-status-danger" role="alert">
          ⚠ Potential medication/allergy conflict — review before finalizing.
        </p>
      )}
    </div>
  );
}