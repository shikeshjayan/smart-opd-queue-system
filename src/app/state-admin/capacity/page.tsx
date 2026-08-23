"use client";

import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { CapacityOverview } from "@/features/state-admin/components/CapacityOverview";

export default function CapacityPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="State Capacity Monitoring" />
      <CapacityOverview />
    </div>
  );
}
