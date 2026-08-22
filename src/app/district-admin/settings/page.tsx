"use client";

import { useDistrictAdmin } from "@/features/auth/context";
import { useDistrictSettings } from "@/features/district-admin/hooks/useDistrictAdminData";
import { useDistrictMutations } from "@/features/district-admin/hooks/useDistrictAdminData";
import { HospitalActivationToggle } from "@/features/district-admin/components/HospitalActivationToggle";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { useState, useEffect } from "react";

export default function DistrictAdminSettingsPage() {
  const { admin, districtId } = useDistrictAdmin();
  const { data: settings, isLoading, error } = useDistrictSettings(districtId ?? "ernakulam");

  if (isLoading || !districtId) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (error || !settings) {
    return <ErrorState message={error ?? "Unable to load settings."} onRetry={() => { }} />;
  }

  const { saveSettings, setHospitalActivation } = useDistrictMutations();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`District Settings - ${admin?.name ?? "District Admin"}`}
        description="Configure district-wide settings and hospital activation"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(settings).map(([key, value]) => (
          <div
            key={key}
            className="rounded-card border border-ink-200 p-4 shadow-card"
          >
            <h3 className="font-medium text-ink-900 mb-3">{key.replace(/_/g, " ")}</h3>
            <p className="text-sm text-ink-500">{JSON.stringify(value, null, 2)}</p>
          </div>
        ))}
      </div>

      <HospitalActivationToggle
        districtId={districtId ?? "ernakulam"}
        onActivationChange={setHospitalActivation}
        settings={settings}
      />
    </div>
  );
}