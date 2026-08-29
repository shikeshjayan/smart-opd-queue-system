"use client";

import { useDistrictAdmin } from "@/features/auth/context";
import { useDistrictResources } from "@/features/district-admin/hooks/useDistrictAdminData";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";

export default function DistrictAdminDepartmentsPage() {
  const { admin, districtId } = useDistrictAdmin();
  const { data: resources, isLoading, error, reload } = useDistrictResources(districtId ?? "ernakulam");

  if (isLoading || !districtId) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (error || !resources) {
    return <ErrorState message={error ?? "Unable to load department data."} onRetry={reload} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`District Departments - ${admin?.name ?? "District Admin"}`}
        description="Resource summary across hospitals"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {resources.map((r) => (
          <div
            key={r.hospitalId}
            className="rounded-card border border-ink-200 p-4 shadow-card hover:shadow-lg transition-shadow"
          >
            <h3 className="font-medium text-ink-900 mb-3">{r.hospitalName}</h3>
            <div className="space-y-1 text-sm text-ink-700">
              <div>Doctors: {r.doctorsAvailable}/{r.doctorsTotal}</div>
              <div>Nurses: {r.nurses}</div>
              <div>Lab Staff: {r.labStaff}</div>
              <div>Pharmacy: {r.pharmacyStaff}</div>
              <div>Active Services: {r.servicesActive}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
