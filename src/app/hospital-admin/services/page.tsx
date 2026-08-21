"use client";

import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import { useAdminDepartments } from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { ServiceList } from "@/features/hospital-admin/components/ServiceList";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServicesPage() {
  const { hospitalId } = useHospitalAdmin();
  const { data: departments, isLoading, error } = useAdminDepartments(hospitalId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Services"
        description="Hospital service catalogue for OPD and diagnostic offerings."
      />
      {error ? (
        <p className="text-sm text-status-danger" role="alert">
          Unable to load departments: {error}
        </p>
      ) : (
        <ServiceList
          hospitalId={hospitalId}
          departments={(departments ?? []).map((d) => ({ id: d.id, name: d.name }))}
        />
      )}
    </div>
  );
}
