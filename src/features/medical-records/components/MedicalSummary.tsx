import Link from "next/link";
import { AllergyCard } from "./AllergyCard";
import { ConditionCard } from "./ConditionCard";
import { MedicationCard } from "./MedicationCard";
import type { MedicalSummary as MedicalSummaryType } from "../types/medical-record.types";

type MedicalSummaryProps = {
  summary: MedicalSummaryType;
  detailsHrefs?: {
    allergies?: string;
    conditions?: string;
    medications?: string;
  };
};

export function MedicalSummary({ summary, detailsHrefs = {} }: MedicalSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <section aria-labelledby="summary-allergies-title" className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <div className="flex items-baseline justify-between gap-2">
          <h3 id="summary-allergies-title" className="text-sm font-semibold text-ink-900">
            Allergies
          </h3>
          <span className="text-2xl font-bold tabular-nums text-status-warning">
            {summary.allergyCount}
          </span>
        </div>
        {summary.allergies.length === 0 ? (
          <p className="mt-2 text-sm text-ink-500">None recorded</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {summary.allergies.slice(0, 3).map((allergy) => (
              <AllergyCard key={allergy.id} {...allergy} />
            ))}
          </ul>
        )}
        {detailsHrefs.allergies && (
          <Link href={detailsHrefs.allergies} className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline">
            View Details
          </Link>
        )}
      </section>

      <section aria-labelledby="summary-conditions-title" className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <div className="flex items-baseline justify-between gap-2">
          <h3 id="summary-conditions-title" className="text-sm font-semibold text-ink-900">
            Current Conditions
          </h3>
          <span className="text-2xl font-bold tabular-nums text-status-info">
            {summary.activeConditionCount}
          </span>
        </div>
        {summary.conditions.length === 0 ? (
          <p className="mt-2 text-sm text-ink-500">None recorded</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {summary.conditions.slice(0, 3).map((condition) => (
              <ConditionCard key={condition.id} {...condition} />
            ))}
          </ul>
        )}
        {detailsHrefs.conditions && (
          <Link href={detailsHrefs.conditions} className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline">
            View Details
          </Link>
        )}
      </section>

      <section aria-labelledby="summary-medications-title" className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <div className="flex items-baseline justify-between gap-2">
          <h3 id="summary-medications-title" className="text-sm font-semibold text-ink-900">
            Long-term Medications
          </h3>
          <span className="text-2xl font-bold tabular-nums text-status-success">
            {summary.medicationCount}
          </span>
        </div>
        {summary.medications.length === 0 ? (
          <p className="mt-2 text-sm text-ink-500">None recorded</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {summary.medications.slice(0, 3).map((medication) => (
              <MedicationCard key={medication.id} {...medication} />
            ))}
          </ul>
        )}
        {detailsHrefs.medications && (
          <Link href={detailsHrefs.medications} className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline">
            View Details
          </Link>
        )}
      </section>
    </div>
  );
}