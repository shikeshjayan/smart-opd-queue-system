"use client";

import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import { useAdminDashboard } from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { HospitalSummary } from "@/features/hospital-admin/components/HospitalSummary";
import { DashboardStats } from "@/features/hospital-admin/components/DashboardStats";
import { QueueOverview } from "@/features/hospital-admin/components/QueueOverview";
import { AlertList } from "@/features/hospital-admin/components/AlertList";
import { getGreeting } from "@/features/hospital-admin/utils/format";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";

export default function HospitalAdminDashboardPage() {
  const { admin, hospitalId } = useHospitalAdmin();
  const { data, isLoading, error, reload } = useAdminDashboard(hospitalId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Unable to load dashboard."} onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">
          {getGreeting()}, {admin?.name ?? "Admin"}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {admin?.role} &middot; {admin?.email}
        </p>
      </div>

      <HospitalSummary hospital={data.hospital} />
      <DashboardStats stats={data.stats} />
      <QueueOverview items={data.queueOverview} />
      <AlertList alerts={data.alerts} />
    </div>
  );
}
