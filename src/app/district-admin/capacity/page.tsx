"use client";

import { useDistrictAdmin } from "@/features/auth/context";
import { useDistrictCapacity } from "@/features/district-admin/hooks/useDistrictAdminData";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import type { CapacityRow } from "@/features/district-admin/types/district-admin.types";

export default function DistrictAdminCapacityPage() {
  const { admin, districtId } = useDistrictAdmin();
  const { data: capacity, isLoading, error } = useDistrictCapacity(districtId ?? "ernakulam");

  if (isLoading || !districtId) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (error || !capacity) {
    return <ErrorState message={error ?? "Unable to load capacity data."} onRetry={() => { }} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Capacity Overview - ${admin?.name ?? "District Admin"}`}
        description="Monitor bed occupancy and capacity status across district hospitals"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {capacity.map((row: CapacityRow) => (
          <div
            key={`${row.hospitalId}-${row.departmentId}`}
            className={`rounded-card border p-4 shadow-card ${
              row.status === "exceeded" ? "border-red-400 bg-red-50" : row.status === "near_capacity" ? "border-orange-400 bg-orange-50" : "border-ink-200 bg-surface"
            }`}
          >
            <h3 className="font-medium text-ink-900">{row.hospitalName}</h3>
            <p className="text-sm text-ink-500">Dept: {row.departmentName}</p>
            <p className="text-sm text-ink-500">Utilization: {row.utilizationPercent}%</p>
            <p className="text-xs text-ink-400">Total: {row.total} / Expected: {row.expectedCapacity}</p>
            {row.status === "exceeded" && (
              <p className="text-xs text-red-600 font-medium">EXCEEDED</p>
            )}
            {row.status === "near_capacity" && (
              <p className="text-xs text-orange-600 font-medium">Near Capacity</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
