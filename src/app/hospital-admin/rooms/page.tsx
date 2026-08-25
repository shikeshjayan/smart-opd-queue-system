"use client";

import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import { useAdminDepartments } from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { RoomList } from "@/features/hospital-admin/components/RoomList";
import { Skeleton } from "@/components/ui/skeleton";

export default function RoomsPage() {
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
        title="Rooms"
        description="Consultation, laboratory and diagnostic rooms available at this hospital."
      />
      {error ? (
        <p className="text-sm text-status-danger" role="alert">
          Unable to load departments: {error}
        </p>
      ) : (
        <RoomList
          hospitalId={hospitalId}
          departments={(departments ?? []).map((d) => ({ id: d.id, name: d.name }))}
        />
      )}
    </div>
  );
}
