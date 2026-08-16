"use client";

import Link from "next/link";
import { useDistrictAdmin } from "@/features/government-admin/district-context";
import { useHospitalsByDistrict } from "@/features/government-admin/hooks/useGovernmentAdmin";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { LiveIndicator } from "@/features/government-admin/components/LiveIndicator";
import { PerformanceTable } from "@/features/government-admin/components/PerformanceTable";
import type { PerformanceColumn } from "@/features/government-admin/components/PerformanceTable";
import type { GovernmentHospitalRow } from "@/services/government/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";

export default function DistrictHospitalsPage() {
  const { districtId } = useDistrictAdmin();
  const { data, isLoading, error, reload } = useHospitalsByDistrict(districtId ?? "ernakulam");

  if (isLoading || !districtId) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Unable to load hospitals."} onRetry={reload} />;
  }

  const columns: PerformanceColumn<GovernmentHospitalRow>[] = [
    {
      key: "hospital",
      header: "Hospital",
      render: (row) => (
        <Link
          href={`/district-admin/hospitals/${row.hospital.id}`}
          className="text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
        >
          {row.hospital.name}
        </Link>
      ),
    },
    {
      key: "patients",
      header: "Patients",
      align: "right",
      render: (row) => row.patientsToday.toLocaleString("en-IN"),
    },
    {
      key: "waiting",
      header: "Waiting",
      align: "right",
      render: (row) => row.waiting,
    },
    {
      key: "completed",
      header: "Completed",
      align: "right",
      render: (row) => row.completed,
    },
    {
      key: "action",
      header: "",
      render: (row) => (
        <Link
          href={`/district-admin/hospitals/${row.hospital.id}`}
          className="rounded-btn border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-surface-muted"
        >
          View Hospital
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Hospitals"
        description="Hospital performance across the district."
        actions={<LiveIndicator />}
      />
      <PerformanceTable
        rows={data}
        columns={columns}
        emptyTitle="No hospitals"
        emptyDescription="No hospitals are registered in this district."
      />
    </div>
  );
}
