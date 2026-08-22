"use client";

import { useServiceAvailability } from "../hooks/useStateAdminData";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";

export function ServiceAvailabilityGrid() {
  const { data, isLoading, error, reload } = useServiceAvailability();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-card" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Could not load service availability"} onRetry={reload} />;
  }

  if (data.length === 0) {
    return <EmptyState title="No services found" description="No active services are available across hospitals." />;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((service) => (
        <div key={service.serviceName} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-ink-900">{service.serviceName}</h3>
            <Badge variant="info">{service.code}</Badge>
          </div>
          <dl className="mt-3 flex gap-6">
            <div>
              <dt className="text-xs text-ink-500">Hospitals</dt>
              <dd className="text-lg font-bold text-ink-900">{service.hospitalCount.toLocaleString("en-IN")}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Districts</dt>
              <dd className="text-lg font-bold text-ink-900">{service.districtCount.toLocaleString("en-IN")}</dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  );
}
