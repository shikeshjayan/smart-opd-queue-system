"use client";

import Link from "next/link";
import { useAsync } from "@/lib/use-async";
import { doctorMockApi } from "@/features/doctor/api/doctor.mock";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function DoctorProfilePage() {
  const { data: doctor, isLoading, error, reload } = useAsync(
    () => doctorMockApi.getProfile(),
    []
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (error || !doctor) {
    return <ErrorState message={error ?? "Unable to load profile."} onRetry={reload} />;
  }

  const details = [
    { id: "name", label: "Name", value: doctor.name },
    { id: "speciality", label: "Speciality", value: doctor.speciality },
    { id: "hospital", label: "Hospital", value: doctor.hospitalName },
    { id: "department", label: "Department", value: doctor.departmentName },
    { id: "opd", label: "Current OPD", value: doctor.opdName },
    { id: "id", label: "Doctor ID", value: doctor.id },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink-900">Profile</h1>

      <section aria-labelledby="profile-details-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <h2 id="profile-details-title" className="sr-only">
          Doctor details
        </h2>
        <dl className="divide-y divide-ink-100 text-sm">
          {details.map((item) => (
            <div key={item.id} className="flex justify-between py-2.5">
              <dt className="text-ink-500">{item.label}</dt>
              <dd className="text-right font-medium text-ink-900">{item.value}</dd>
            </div>
          ))}
        </dl>
        <Link
          href="/doctor/dashboard"
          className="mt-4 inline-flex h-11 items-center rounded-btn bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Back to Dashboard
        </Link>
      </section>
    </div>
  );
}
