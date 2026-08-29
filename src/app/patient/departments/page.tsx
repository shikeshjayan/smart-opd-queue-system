"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useHospital } from "@/features/hospital/hooks/useHospitals";
import { useDepartments } from "@/features/department/hooks/useDepartments";
import { DepartmentCard } from "@/features/department/components/DepartmentCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import Link from "next/link";

function DepartmentsContent() {
  const searchParams = useSearchParams();
  const hospitalId = searchParams.get("hospital") ?? "";
  const { data: hospital, isLoading: hospitalLoading } = useHospital(hospitalId);
  const { data: departments, isLoading: deptLoading, error, reload } = useDepartments(hospitalId);
  const isLoading = hospitalLoading || deptLoading;

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/patient/hospitals"
        className="text-sm text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
      >
        &larr; All Hospitals
      </Link>

      {hospitalLoading ? (
        <Skeleton className="h-7 w-64" />
      ) : hospital ? (
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Select Department</h1>
          <p className="mt-1 text-sm text-ink-500">{hospital.name}, {hospital.districtId}</p>
        </div>
      ) : (
        <h1 className="text-2xl font-bold text-ink-900">Select Department</h1>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !departments || departments.length === 0 ? (
        <EmptyState title="No departments found" description="This hospital has no active departments." />
      ) : (
        <ul className="flex flex-col gap-3">
          {departments.map((department) => (
            <li key={department.id}>
              <DepartmentCard department={department} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DepartmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-20 w-full" />
        </div>
      }
    >
      <DepartmentsContent />
    </Suspense>
  );
}
