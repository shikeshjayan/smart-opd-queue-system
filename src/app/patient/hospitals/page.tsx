"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useHospitals } from "@/features/hospital/hooks/useHospitals";
import { HospitalCard } from "@/features/hospital/components/HospitalCard";
import { DistrictFilter } from "@/features/hospital/components/DistrictFilter";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import type { HospitalQuery } from "@/features/hospital/types/hospital.types";
import { useState } from "react";
import type { ChangeEvent } from "react";

function HospitalsContent() {
  const searchParams = useSearchParams();
  const district = (searchParams.get("district") ?? "") as HospitalQuery["district"];
  const [search, setSearch] = useState("");
  const { data, isLoading, error, reload } = useHospitals({ district, search });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-ink-900">Select Hospital</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <DistrictFilter />
        <label className="block flex-1">
          <span className="mb-1 block text-sm font-medium text-ink-700">Search hospitals</span>
          <Input
            type="search"
            placeholder="Search by name..."
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="No hospitals found"
          description="Try selecting a different district or search term."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {data.map((hospital) => (
            <li key={hospital.id}>
              <HospitalCard hospital={hospital} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function HospitalsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      }
    >
      <HospitalsContent />
    </Suspense>
  );
}
