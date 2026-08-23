"use client";

import { useStateStats } from "@/features/state-admin/hooks/useStateAdminData";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { StatGrid } from "@/features/government-admin/components/StatGrid";
import { TrendChart } from "@/features/state-admin/components/TrendChart";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";

export default function AnalyticsPage() {
  const { data, isLoading, error, reload } = useStateStats();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Unable to load analytics."} onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="State Analytics" />
      
      <StatGrid
        items={[
          { id: "patients", label: "Patients Today", value: data.patientsToday },
          { id: "appointments", label: "Appointments", value: data.appointments },
          { id: "activeOpds", label: "Active OPDs", value: data.activeOpds },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TrendChart
          title="OPD Volume Trend"
          data={[
            { label: "Mon", value: 1200 },
            { label: "Tue", value: 1350 },
            { label: "Wed", value: 1100 },
          ]}
        />
        <TrendChart
          title="Wait Time Trend"
          data={[
            { label: "Mon", value: 45 },
            { label: "Tue", value: 50 },
            { label: "Wed", value: 40 },
          ]}
        />
      </div>
    </div>
  );
}
