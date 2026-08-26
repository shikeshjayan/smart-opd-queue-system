"use client";

import { Suspense } from "react";
import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { SessionDayBoard } from "@/features/hospital-admin/components/SessionDayBoard";
import { Skeleton } from "@/components/ui/skeleton";

export default function OpdSessionsPage() {
  const { hospitalId } = useHospitalAdmin();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="OPD Sessions"
        description="Daily session lifecycle: open, activate, pause and complete department OPDs."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <SessionDayBoard />
      </Suspense>
    </div>
  );
}
