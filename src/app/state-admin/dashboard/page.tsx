"use client";

import Link from "next/link";
import { useStateDashboard } from "@/features/government-admin/hooks/useGovernmentAdmin";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { LiveIndicator } from "@/features/government-admin/components/LiveIndicator";
import { StatGrid } from "@/features/government-admin/components/StatGrid";
import { DistrictCard } from "@/features/government-admin/components/DistrictCard";
import { AlertList } from "@/features/government-admin/components/AlertList";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";

export default function StateDashboardPage() {
  const { data, isLoading, error, reload } = useStateDashboard();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Unable to load the state dashboard."} onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="State Dashboard"
        description={`${data.state.name} · ${data.state.districts} districts · ${data.state.hospitals.toLocaleString("en-IN")} hospitals`}
        actions={<LiveIndicator />}
      />

      <StatGrid
        items={[
          { id: "patients", label: "Patients Today", value: data.totals.patientsToday, highlight: true },
          { id: "opds", label: "Active OPDs", value: data.totals.activeOpds },
          { id: "waiting", label: "Currently Waiting", value: data.totals.waiting },
          { id: "completed", label: "Completed", value: data.totals.completed },
          { id: "avgwait", label: "Avg Wait", value: `${data.totals.avgWaitMinutes}m` },
        ]}
      />

      <section aria-labelledby="district-performance-title">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="district-performance-title" className="text-lg font-semibold text-ink-900">
            District Performance
          </h2>
          <Link
            href="/state-admin/districts"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            View all districts
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.districts.map((district) => (
            <DistrictCard
              key={district.districtId}
              district={district}
              href={`/state-admin/districts#${district.districtId}`}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="bottleneck-title">
        <h2 id="bottleneck-title" className="mb-3 text-lg font-semibold text-ink-900">
          Top Bottlenecks
        </h2>
        <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
          <ul className="flex flex-col divide-y divide-ink-200">
            {data.bottlenecks.map((bottleneck) => (
              <li
                key={bottleneck.hospitalId}
                className="flex flex-wrap items-center justify-between gap-2 bg-surface p-4"
              >
                <div>
                  <Link
                    href={`/state-admin/hospitals?district=${bottleneck.districtId}`}
                    className="font-medium text-ink-900 hover:underline"
                  >
                    {bottleneck.hospitalName}
                  </Link>
                  <p className="text-sm text-ink-500">
                    {bottleneck.departmentName} &middot; {bottleneck.districtId}
                  </p>
                </div>
                <Badge variant="danger">{bottleneck.waiting} waiting</Badge>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <AlertList alerts={data.criticalAlerts} limit={4} />
        <Link
          href="/state-admin/alerts"
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          View all alerts
        </Link>
      </div>
    </div>
  );
}
