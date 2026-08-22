"use client";

import { useStateStats, useDistrictComparison } from "@/features/state-admin/hooks/useStateAdminData";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { StatGrid } from "@/features/government-admin/components/StatGrid";
import { DistrictComparisonTable } from "@/features/state-admin/components/DistrictComparisonTable";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";

export default function StateDashboardPage() {
  const { data: stats, isLoading: statsLoading, error: statsError, reload: reloadStats } = useStateStats();
  const { data: districts, isLoading: districtsLoading, error: districtsError, reload: reloadDistricts } = useDistrictComparison();

  if (statsLoading || districtsLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (statsError || districtsError || !stats) {
    return <ErrorState message={statsError ?? districtsError ?? "Unable to load dashboard data."} onRetry={() => { reloadStats(); reloadDistricts(); }} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="State Dashboard"
        description="Kerala - aggregated state-wide operations"
      />

      <StatGrid
        items={[
          { id: "hospitals", label: "Hospitals", value: stats.hospitals },
          { id: "districts", label: "Districts", value: stats.districts },
          { id: "patientsToday", label: "Patients Today", value: stats.patientsToday },
          { id: "opdCompleted", label: "OPD Completed", value: stats.opdConsultations },
          { id: "waiting", label: "Currently Waiting", value: stats.waiting },
          { id: "avgWait", label: "Avg Wait", value: `${stats.avgWaitMinutes}m` },
        ]}
      />

      <section aria-labelledby="district-performance-title">
        <h2 id="district-performance-title" className="mb-3 text-lg font-semibold text-ink-900">
          District Performance
        </h2>
        <DistrictComparisonTable />
      </section>
    </div>
  );
}
