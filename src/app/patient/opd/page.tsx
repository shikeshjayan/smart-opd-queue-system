"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useHospital } from "@/features/hospital/hooks/useHospitals";
import { useDepartments } from "@/features/department/hooks/useDepartments";
import { useOpds } from "@/features/opd/hooks/useOpd";
import { OpdCard } from "@/features/opd/components/OpdCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import Link from "next/link";

function OpdContent() {
  const searchParams = useSearchParams();
  const hospitalId = searchParams.get("hospital") ?? "";
  const departmentId = searchParams.get("department") ?? "";

  const { data: hospital } = useHospital(hospitalId);
  const { data: departments } = useDepartments(hospitalId);
  const departmentName = departments?.find((d) => d.id === departmentId)?.name ?? "";
  const { data: opds, isLoading, error, reload } = useOpds(departmentId);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={hospitalId ? `/patient/departments?hospital=${hospitalId}` : "/patient/hospitals"}
        className="text-sm text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
      >
        &larr; Back to Departments
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-ink-900">Today&apos;s OPDs</h1>
        {departmentName && (
          <p className="mt-1 text-sm text-ink-500">
            {departmentName}{hospital ? ` — ${hospital.name}` : ""}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !opds || opds.length === 0 ? (
        <EmptyState
          title="No OPD sessions found"
          description="There are no OPD sessions scheduled in this department."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {opds.map((opd) => (
            <li key={opd.id}>
              <OpdCard opd={opd} departmentName={departmentName} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function OpdPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-44 w-full" />
        </div>
      }
    >
      <OpdContent />
    </Suspense>
  );
}
