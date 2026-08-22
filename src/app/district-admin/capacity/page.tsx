"use client";

import { useDistrictAdmin } from "@/features/auth/context";
import { useDistrictCapacity } from "@/features/district-admin/hooks/useDistrictAdminData";
import { CapacityOverviewRow } from "@/features/district-admin/components/CapacityOverview";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { useState, useEffect } from "react";

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

  const { rows } = capacity;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Capacity Overview - ${admin?.name ?? "District Admin"}`}
        description="Monitor bed occupancy and capacity status across district hospitals"
      />

      <CapacityOverview rows={rows} columns={{ field: "hospitalId" as const, header: "Hospital" }} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div
            key={row.hospitalId}
            className={row.exceeded ? "bg-red-100 border-red-400" : row.critical ? "bg-orange-100 border-orange-400" : "bg-surface"}
          >
            <h3 className="font-medium text-ink-900">{row.hospitalName}</h3>
            <p className="text-sm text-ink-500">Dept: {row.departmentName}</p>
            <p className="text-sm text-ink-500">Occupancy: {row.utilizationPercent}%</p>
            {row.exceeded && (
              <p className="text-xs text-red-600 font-medium">EXCEEDED</p>
            )}
            {!row.exceeded && row.critical && (
              <p className="text-xs text-orange-600 font-medium">Critical</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}