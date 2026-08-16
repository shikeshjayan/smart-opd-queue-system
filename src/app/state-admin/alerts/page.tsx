"use client";

import { useState } from "react";
import { useAlerts } from "@/features/government-admin/hooks/useGovernmentAdmin";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { LiveIndicator } from "@/features/government-admin/components/LiveIndicator";
import { AlertList } from "@/features/government-admin/components/AlertList";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { getDistrictName } from "@/config/districts";
import type { GovernmentAlertSeverity, GovernmentAlertStatus } from "@/types";

export default function StateAlertsPage() {
  const [district, setDistrict] = useState("");
  const [severity, setSeverity] = useState<GovernmentAlertSeverity | "">("");
  const [status, setStatus] = useState<GovernmentAlertStatus | "">("");

  const { data, isLoading, error, reload } = useAlerts(null, {
    severity: severity || undefined,
    status: status || undefined,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Unable to load alerts."} onRetry={reload} />;
  }

  const districts = Array.from(new Set(data.map((alert) => alert.districtId))).sort();
  const filtered = data.filter((alert) => !district || alert.districtId === district);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Alerts"
        description="Operational alerts across all districts."
        actions={<LiveIndicator />}
      />

      <div className="flex flex-wrap gap-4 rounded-card border border-ink-200 bg-surface p-4">
        <label className="block w-full max-w-xs">
          <span className="mb-1 block text-sm font-medium text-ink-700">District</span>
          <Select value={district} onChange={(e) => setDistrict(e.target.value)}>
            <option value="">All districts</option>
            {districts.map((id) => (
              <option key={id} value={id}>
                {getDistrictName(id)}
              </option>
            ))}
          </Select>
        </label>
        <label className="block w-full max-w-xs">
          <span className="mb-1 block text-sm font-medium text-ink-700">Severity</span>
          <Select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as GovernmentAlertSeverity | "")}
          >
            <option value="">All severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </Select>
        </label>
        <label className="block w-full max-w-xs">
          <span className="mb-1 block text-sm font-medium text-ink-700">Status</span>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as GovernmentAlertStatus | "")}
          >
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </Select>
        </label>
      </div>

      <AlertList alerts={filtered} />
    </div>
  );
}
