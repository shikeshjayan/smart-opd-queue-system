"use client";

import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { ServiceAvailabilityGrid } from "@/features/state-admin/components/ServiceAvailabilityGrid";

export default function ServicesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="State-Level Service Availability"
        description="Services across Kerala government hospitals"
      />
      <ServiceAvailabilityGrid />
    </div>
  );
}
