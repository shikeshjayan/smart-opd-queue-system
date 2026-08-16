"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  useGovernmentHospitalRows,
  useDistricts,
} from "@/features/government-admin/hooks/useGovernmentAdmin";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { PerformanceTable } from "@/features/government-admin/components/PerformanceTable";
import type { PerformanceColumn } from "@/features/government-admin/components/PerformanceTable";
import { HealthBadge } from "@/features/hospital-admin/components/HealthBadge";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import type { GovernmentHospitalRow } from "@/services/government/types";
import type { DistrictId } from "@/config/districts";

function StateHospitalsContent() {
  const searchParams = useSearchParams();
  const initialDistrict = searchParams.get("district") ?? "";
  const [districtFilter, setDistrictFilter] = useState<string>(initialDistrict);

  const { data: rows, isLoading, error, reload } = useGovernmentHospitalRows();
  const { data: districts } = useDistricts();

  const filtered = useMemo(
    () => (rows ?? []).filter((row) => !districtFilter || row.districtId === districtFilter),
    [rows, districtFilter]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !rows) {
    return <ErrorState message={error ?? "Unable to load hospitals."} onRetry={reload} />;
  }

  const columns: PerformanceColumn<GovernmentHospitalRow>[] = [
    {
      key: "hospital",
      header: "Hospital",
      render: (row) => <span className="font-medium text-ink-900">{row.hospital.name}</span>,
    },
    {
      key: "district",
      header: "District",
      render: (row) => <span className="text-ink-700">{row.hospital.district}</span>,
    },
    {
      key: "departments",
      header: "Depts",
      align: "right",
      render: (row) => row.departments,
    },
    {
      key: "opds",
      header: "Active OPDs",
      align: "right",
      render: (row) => row.activeOpds,
    },
    {
      key: "doctors",
      header: "Doctors",
      align: "right",
      render: (row) => row.doctors,
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
      render: (row) => <span className="font-semibold text-ink-900">{row.waiting}</span>,
    },
    {
      key: "health",
      header: "Health",
      render: (row) => <HealthBadge health={row.health} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Hospitals" description="All hospitals in the state network." />

      <div className="flex flex-wrap items-center gap-4 rounded-card border border-ink-200 bg-surface p-4">
        <label className="block w-full max-w-xs">
          <span className="mb-1 block text-sm font-medium text-ink-700">District</span>
          <Select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value as DistrictId | "")}
          >
            <option value="">All districts</option>
            {(districts ?? []).map((district) => (
              <option key={district.districtId} value={district.districtId}>
                {district.districtName}
              </option>
            ))}
          </Select>
        </label>
        <span className="text-sm text-ink-500">
          Showing <span className="font-semibold text-ink-900">{filtered.length}</span> hospitals.
        </span>
      </div>

      <PerformanceTable
        rows={filtered}
        columns={columns}
        emptyTitle="No hospitals"
        emptyDescription="No hospitals match the selected district."
      />
    </div>
  );
}

export default function StateHospitalsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <StateHospitalsContent />
    </Suspense>
  );
}
