import { MedicalSummary } from "@/features/medical-records/components/MedicalSummary";
import { RecordAccessNotice } from "@/features/medical-records/components/RecordAccessNotice";
import { ActiveMedicationList } from "@/features/prescription/components/ActiveMedicationList";
import { useDoctorPatient } from "@/features/medical-records/hooks/useMedicalRecords";
import { Skeleton } from "@/components/ui/skeleton";

type PatientSummaryPanelProps = {
  patientId: string;
};

export function PatientSummaryPanel({ patientId }: PatientSummaryPanelProps) {
  const { data, isLoading, error } = useDoctorPatient(patientId);

  return (
    <aside className="flex flex-col gap-4" aria-label="Patient summary">
      <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <RecordAccessNotice audience="doctor" />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : error || !data ? (
        <p className="rounded-card border border-status-danger-soft bg-status-danger-soft p-4 text-sm text-status-danger">
          {error ?? "Unable to load patient summary."}
        </p>
      ) : (
        <MedicalSummary
          summary={data.summary}
          detailsHrefs={{
            allergies: `/doctor/patients/${patientId}/history`,
            conditions: `/doctor/patients/${patientId}/history`,
            medications: `/doctor/patients/${patientId}/history`,
          }}
        />
      )}

      <section aria-labelledby="active-meds-title" className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <h3 id="active-meds-title" className="mb-3 text-sm font-semibold text-ink-900">
          Medications
        </h3>
        <ActiveMedicationList patientId={patientId} />
      </section>
    </aside>
  );
}