"use client";

import { useState } from "react";
import { useEncounters, usePatientHistory } from "@/features/medical-records/hooks/useMedicalRecords";
import { EncounterCard } from "@/features/medical-records/components/EncounterCard";
import { HistoryFilters } from "@/features/medical-records/components/HistoryFilters";
import { MedicalSummary } from "@/features/medical-records/components/MedicalSummary";
import { MedicalTimeline } from "@/features/medical-records/components/MedicalTimeline";
import { Pagination } from "@/features/medical-records/components/Pagination";
import { RecordAccessNotice } from "@/features/medical-records/components/RecordAccessNotice";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { HistoryFilters as HistoryFiltersType } from "@/features/medical-records/types/medical-record.types";

const PAGE_SIZE = 5;

type HistoryTab = "overview" | "timeline" | "visits";

const tabStyles = (active: boolean) =>
  `px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
    active
      ? "border-brand-600 text-brand-600"
      : "border-transparent text-ink-500 hover:text-ink-700"
  }`;

export default function PatientHistoryPage() {
  const { data, isLoading, error, reload } = usePatientHistory();
  const [activeTab, setActiveTab] = useState<HistoryTab>("overview");
  const [filters, setFilters] = useState<HistoryFiltersType>({ keyword: "" });
  const [page, setPage] = useState(1);

  const visits = useEncounters(filters, page, PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Unable to load medical history."} onRetry={reload} />;
  }

  const { patient, summary, encounters, facets } = data;
  const recentEncounters = encounters.slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Medical History</h1>
        <p className="mt-1 text-sm text-ink-500">
          {patient.name} &middot; {patient.age} yrs &middot; {summary.totalVisits} visits on record
        </p>
      </div>

      <RecordAccessNotice audience="patient" />

      <div role="tablist" aria-label="Medical history sections" className="flex gap-1 border-b border-ink-200">
        <button
          role="tab"
          aria-selected={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
          className={tabStyles(activeTab === "overview")}
        >
          Overview
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "timeline"}
          onClick={() => setActiveTab("timeline")}
          className={tabStyles(activeTab === "timeline")}
        >
          Timeline
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "visits"}
          onClick={() => setActiveTab("visits")}
          className={tabStyles(activeTab === "visits")}
        >
          Visits
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="flex flex-col gap-6">
          <MedicalSummary
            summary={summary}
            detailsHrefs={{ allergies: "/patient/profile", conditions: "/patient/profile", medications: "/patient/profile" }}
          />

          <section aria-labelledby="recent-visits-title">
            <h2 id="recent-visits-title" className="text-lg font-semibold text-ink-900">
              Recent Visits
            </h2>
            {recentEncounters.length === 0 ? (
              <div className="mt-3">
                <EmptyState title="No visits yet" description="Your visits across government hospitals will appear here." />
              </div>
            ) : (
              <>
                <ol className="mt-3 flex flex-col gap-3">
                  {recentEncounters.map((encounter) => (
                    <EncounterCard
                      key={encounter.id}
                      encounter={encounter}
                      href={`/patient/history/encounters/${encounter.id}`}
                    />
                  ))}
                </ol>
                <button
                  type="button"
                  onClick={() => setActiveTab("visits")}
                  className="mt-4 rounded-btn border border-brand-600 px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-600"
                >
                  View All Visits
                </button>
              </>
            )}
          </section>
        </div>
      )}

      {activeTab === "timeline" && (
        <MedicalTimeline
          encounters={encounters}
          detailHref={(encounterId) => `/patient/history/encounters/${encounterId}`}
        />
      )}

      {activeTab === "visits" && (
        <div className="flex flex-col gap-4">
          <HistoryFilters filters={filters} facets={facets} onChange={(next) => { setFilters(next); setPage(1); }} />

          {visits.isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : visits.error ? (
            <ErrorState message={visits.error} onRetry={visits.reload} />
          ) : visits.data && visits.data.items.length > 0 ? (
            <>
              <ol className="flex flex-col gap-3">
                {visits.data.items.map((encounter) => (
                  <EncounterCard
                    key={encounter.id}
                    encounter={encounter}
                    href={`/patient/history/encounters/${encounter.id}`}
                  />
                ))}
              </ol>
              <Pagination
                page={visits.data.page}
                pageSize={visits.data.pageSize}
                total={visits.data.total}
                onPageChange={setPage}
              />
            </>
          ) : (
            <EmptyState
              title="No matching visits"
              description="Try adjusting your search or filters to find past visits."
            />
          )}
        </div>
      )}
    </div>
  );
}