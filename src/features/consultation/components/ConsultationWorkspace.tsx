"use client";

import { useState } from "react";
import { MedicalSummary } from "@/features/medical-records/components/MedicalSummary";
import { MedicalTimeline } from "@/features/medical-records/components/MedicalTimeline";
import { HistoryFilters as HistoryFiltersComponent } from "@/features/medical-records/components/HistoryFilters";
import { EncounterCard } from "@/features/medical-records/components/EncounterCard";
import { PrescriptionHistory } from "@/features/prescription/components/PrescriptionHistory";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useDoctorPatient } from "@/features/medical-records/hooks/useMedicalRecords";
import type { HistoryFilters as HistoryFiltersType, PatientEncounter, HistoryFacets } from "@/features/medical-records/types/medical-record.types";
import { PatientHeader } from "./PatientHeader";
import { PatientSummaryPanel } from "./PatientSummaryPanel";
import { ConsultationFormSession } from "./ConsultationFormSession";
import { CompletedRecordView } from "./CompletedRecordView";
import { ConsultationCompleteScreen } from "./ConsultationCompleteScreen";
import { ConsultationEmptyState } from "./ConsultationEmptyState";
import { useConsultationForPatient } from "../hooks/useConsultation";
import { consultationMockApi } from "../api/consultation.mock";
import { PrescriptionWorkspace } from "@/features/prescription/components/PrescriptionWorkspace";
import { DiagnosticsWorkspace } from "@/features/diagnostics/components/DiagnosticsWorkspace";
import { DocumentsWorkspace } from "@/features/medical-documents/components/DocumentsWorkspace";
import { RecentDocuments } from "@/features/medical-documents/components/RecentDocuments";

export type WorkspaceTab = "overview" | "history" | "consultation" | "prescription" | "diagnostics" | "documents";

const TAB_LABELS: Array<[WorkspaceTab, string]> = [
  ["overview", "Overview"],
  ["history", "History"],
  ["consultation", "Consultation"],
  ["prescription", "Prescription"],
  ["diagnostics", "Diagnostics"],
  ["documents", "Documents"],
];

type ConsultationWorkspaceProps = {
  patientId: string;
  defaultTab?: WorkspaceTab;
};

export function ConsultationWorkspace({ patientId, defaultTab = "overview" }: ConsultationWorkspaceProps) {
  const [tab, setTab] = useState<WorkspaceTab>(defaultTab);
  const patientView = useDoctorPatient(patientId);
  const consultation = useConsultationForPatient(patientId);
  const [completedContext, setCompletedContext] = useState<Awaited<ReturnType<typeof consultationMockApi.getOrCreateForPatient>>>(null);

  const encounter = consultation.data?.encounter ?? null;
  const active = !!encounter && (encounter.status === "open" || encounter.status === "in_progress");
  const isCompleted = completedContext?.encounter.status === "completed" || (!!encounter && encounter.status === "completed");

  const allergies = patientView.data?.summary.allergies.map((a) => a.substance) ?? [];

  if (patientView.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (patientView.error || !patientView.data) {
    return <ErrorState message={patientView.error ?? "Patient not found."} onRetry={patientView.reload} />;
  }

  const { patient, summary, encounters, facets } = patientView.data;

  return (
    <div className="flex flex-col gap-6">
      <PatientHeader patient={patient} encounter={encounter} />

      <div role="tablist" aria-label="Patient workspace sections" className="flex gap-1 overflow-x-auto border-b border-ink-200">
        {TAB_LABELS.map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === value
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-ink-500 hover:text-ink-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="flex flex-col gap-6">
          <MedicalSummary
            summary={summary}
            detailsHrefs={{
              allergies: `/doctor/patients/${patientId}/history`,
              conditions: `/doctor/patients/${patientId}/history`,
              medications: `/doctor/patients/${patientId}/history`,
            }}
          />
          <section aria-labelledby="recent-title">
            <div className="flex items-center justify-between gap-2">
              <h2 id="recent-title" className="text-lg font-semibold text-ink-900">
                Recent Encounters
              </h2>
              <button
                type="button"
                onClick={() => setTab("history")}
                className="rounded-btn border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
              >
                View Full History
              </button>
            </div>
            {encounters.length === 0 ? (
              <div className="mt-3">
                <EmptyState title="No visits yet" description="Past encounters across hospitals will appear here." />
              </div>
            ) : (
              <ol className="mt-3 flex flex-col gap-3">
                {encounters.slice(0, 3).map((encounterItem) => (
                  <EncounterCard
                    key={encounterItem.id}
                    encounter={encounterItem}
                    href={`/doctor/patients/${patientId}/encounters/${encounterItem.id}`}
                  />
                ))}
              </ol>
            )}
          </section>
        </div>
      )}

      {tab === "history" && <HistoryTab patientId={patientId} encounters={encounters} facets={facets} />}

      {tab === "consultation" && (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[22rem_1fr]">
          <PatientSummaryPanel patientId={patientId} />
          <div className="flex min-w-0 flex-col gap-4">
            {consultation.isLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : consultation.error ? (
              <ErrorState message={consultation.error} onRetry={consultation.reload} />
            ) : completedContext?.encounter.status === "completed" ? (
              <ConsultationCompleteScreen
                encounter={completedContext.encounter}
                patient={completedContext.patient ?? patient}
              />
            ) : isCompleted && encounter ? (
              <CompletedRecordView encounterId={encounter.id} patientId={patientId} />
            ) : active && consultation.data ? (
              <ConsultationFormSession
                key={encounter.id}
                encounter={encounter}
                record={consultation.data.record}
                allergies={allergies}
                onCompleted={setCompletedContext}
              />
            ) : (
              <ConsultationEmptyState />
            )}
          </div>
        </div>
      )}

      {tab === "prescription" && <PrescriptionWorkspace patientId={patientId} />}

      {tab === "diagnostics" && <DiagnosticsWorkspace patientId={patientId} />}

      {tab === "documents" && <DocumentsWorkspace patientId={patientId} audience="doctor" />}
    </div>
  );
}

function HistoryTab({
  patientId,
  encounters,
  facets,
}: {
  patientId: string;
  encounters: PatientEncounter[];
  facets: HistoryFacets;
}) {
  const [filters, setFilters] = useState<HistoryFiltersType>({ keyword: "" });

  const filtered = encounters.filter((encounter) => {
    if (filters.year && encounter.date.slice(0, 4) !== filters.year) return false;
    if (filters.hospitalId && encounter.hospitalId !== filters.hospitalId) return false;
    if (filters.departmentId && encounter.departmentId !== filters.departmentId) return false;
    if (filters.keyword.trim()) {
      const needle = filters.keyword.trim().toLowerCase();
      const haystack = `${encounter.reason} ${encounter.departmentName} ${encounter.doctorName} ${encounter.hospitalName}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card border border-status-info-soft bg-status-info-soft px-4 py-3">
        <p className="text-xs text-status-info">
          Patient medical record — access provided for authorized clinical care. Hospital:{" "}
          {encounters[0]?.hospitalName ?? "—"} · Department: {encounters[0]?.departmentName ?? "—"}
        </p>
      </div>
      <HistoryFiltersComponent filters={filters} facets={facets} onChange={setFilters} />
      {filtered.length === 0 ? (
        <EmptyState title="No matching history" description="Try adjusting your search or filters." />
      ) : (
        <MedicalTimeline
          encounters={filtered}
          detailHref={(encounterId) => `/doctor/patients/${patientId}/encounters/${encounterId}`}
        />
      )}

      <section aria-labelledby="prescription-history-title">
        <h2 id="prescription-history-title" className="text-lg font-semibold text-ink-900">
          Prescription History
        </h2>
        <div className="mt-3">
          <PrescriptionHistory patientId={patientId} />
        </div>
      </section>

      <section aria-labelledby="recent-documents-title">
        <h2 id="recent-documents-title" className="text-lg font-semibold text-ink-900">
          Recent Documents
        </h2>
        <div className="mt-3">
          <RecentDocuments patientId={patientId} viewAllHref={`/doctor/patients/${patientId}/documents`} />
        </div>
      </section>
    </div>
  );
}