"use client";

import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { DistrictComparisonTable } from "@/features/state-admin/components/DistrictComparisonTable";

export default function StateDistrictsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="District Comparison" />
      <DistrictComparisonTable />
    </div>
  );
}
