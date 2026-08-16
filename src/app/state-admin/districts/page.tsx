"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useDistricts,
  useHospitalsByDistrict,
} from "@/features/government-admin/hooks/useGovernmentAdmin";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { DistrictCard } from "@/features/government-admin/components/DistrictCard";
import { PerformanceTable } from "@/features/government-admin/components/PerformanceTable";
import type { PerformanceColumn } from "@/features/government-admin/components/PerformanceTable";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { DISTRICT_ADMIN_DISTRICT_ID } from "@/config/app";
import type { DistrictPerformance } from "@/types";
import type { GovernmentHospitalRow } from "@/services/government/types";

export default function StateDistrictsPage() {
  const { data: districts, isLoading, error, reload } = useDistricts();
  const [selected, setSelected] = useState<DistrictPerformance | null>(null);

  const {
    data: hospitals,
    isLoading: hospitalsLoading,
    error: hospitalsError,
    reload: reloadHospitals,
  } = useHospitalsByDistrict(selected?.districtId ?? "ernakulam");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (error || !districts) {
    return <ErrorState message={error ?? "Unable to load districts."} onRetry={reload} />;
  }

  const columns: PerformanceColumn<GovernmentHospitalRow>[] = [
    {
      key: "hospital",
      header: "Hospital",
      render: (row) => (
        <Link
          href={`/state-admin/hospitals?district=${selected?.districtId ?? ""}`}
          className="text-brand-600 hover:underline"
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
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Districts"
        description="Performance of all districts in Kerala."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {districts.map((district) => (
          <DistrictCard
            key={district.districtId}
            district={district}
            onSelect={() => setSelected(district)}
          />
        ))}
      </div>

      {selected && (
        <section
          aria-labelledby="district-detail-title"
          className="flex flex-col gap-4 rounded-card border border-ink-200 bg-surface p-5 shadow-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="district-detail-title" className="text-lg font-semibold text-ink-900">
              {selected.districtName} — Overview
            </h2>
            {selected.districtId === DISTRICT_ADMIN_DISTRICT_ID ? (
              <Link
                href="/district-admin/dashboard"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-btn bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                View District Dashboard
              </Link>
            ) : (
              <span className="text-sm text-ink-500">
                District dashboard available for {DISTRICT_ADMIN_DISTRICT_ID} in this demo
              </span>
            )}
          </div>

          {hospitalsError ? (
            <ErrorState message={hospitalsError} onRetry={reloadHospitals} />
          ) : hospitalsLoading ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <PerformanceTable rows={hospitals ?? []} columns={columns} />
          )}
        </section>
      )}
    </div>
  );
}
