"use client";

import { useAsync } from "@/lib/use-async";
import { stateAdminService } from "@/services/state";
import type { SystemHealthStatus } from "../types/state-admin.types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";

const statusMeta: Record<SystemHealthStatus, { label: string; dot: string; text: string; softBg: string }> = {
  healthy: {
    label: "Healthy",
    dot: "bg-status-success",
    text: "text-status-success",
    softBg: "bg-status-success-soft",
  },
  degraded: {
    label: "Degraded",
    dot: "bg-status-warning",
    text: "text-status-warning",
    softBg: "bg-status-warning-soft",
  },
  down: {
    label: "Down",
    dot: "bg-status-danger",
    text: "text-status-danger",
    softBg: "bg-status-danger-soft",
  },
};

function formatCheckedAt(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function SystemHealthPanel() {
  const { data, isLoading, error, reload } = useAsync(() => stateAdminService.getSystemHealth(), []);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Could not load system health"} onRetry={reload} />;
  }

  const overall = statusMeta[data.overall];

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`flex items-center justify-between rounded-card border border-ink-200 p-4 shadow-card ${overall.softBg}`}
      >
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${overall.dot}`} aria-hidden="true" />
          <p className="font-semibold text-ink-900">Overall Status</p>
        </div>
        <p className={`text-lg font-bold ${overall.text}`}>{overall.label}</p>
      </div>

      <ul className="flex flex-col gap-3">
        {data.services.map((service) => {
          const meta = statusMeta[service.status];
          return (
            <li key={service.id} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden="true" />
                  <p className="font-medium text-ink-900">{service.service}</p>
                </div>
                <span className="text-xs text-ink-400">Checked {formatCheckedAt(service.lastCheckedAt)}</span>
              </div>
              {service.detail && <p className="mt-1 text-sm text-ink-700">{service.detail}</p>}
            </li>
          );
        })}
      </ul>

      {data.incidents.length > 0 && (
        <ul className="flex flex-col gap-3">
          {data.incidents.map((incident) => (
            <li key={incident.id} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-ink-900">{incident.title}</p>
                <div className="flex items-center gap-2">
                  <Badge variant={incident.severity === "critical" ? "danger" : "warning"}>
                    {incident.severity === "critical" ? "Critical" : "Warning"}
                  </Badge>
                  <Badge variant={incident.status === "active" ? "warning" : "success"}>
                    {incident.status === "active" ? "Active" : "Resolved"}
                  </Badge>
                </div>
              </div>
              <p className="mt-1 text-xs text-ink-400">{formatDateTime(incident.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
