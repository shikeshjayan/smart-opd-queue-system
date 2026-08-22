"use client";

import { useAsync } from "@/lib/use-async";
import { stateAdminService } from "@/services/state";
import type { GovernmentAlert } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";

type SeverityGroup = "critical" | "warning" | "notice";

const groupOrder: SeverityGroup[] = ["critical", "warning", "notice"];

const groupMeta: Record<
  SeverityGroup,
  { label: string; variant: "danger" | "warning" | "info"; countText: string; dot: string }
> = {
  critical: { label: "Critical", variant: "danger", countText: "text-status-danger", dot: "bg-status-danger" },
  warning: { label: "Warning", variant: "warning", countText: "text-status-warning", dot: "bg-status-warning" },
  notice: { label: "Notice", variant: "info", countText: "text-status-info", dot: "bg-status-info" },
};

function groupFor(severity: GovernmentAlert["severity"]): SeverityGroup {
  return severity === "critical" ? "critical" : severity === "warning" ? "warning" : "notice";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function StateAlertsPanel() {
  const { data, isLoading, error, reload } = useAsync(() => stateAdminService.getAlertsSummary(), []);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Could not load alerts"} onRetry={reload} />;
  }

  return (
    <div className="rounded-card border border-ink-200 bg-surface shadow-card overflow-hidden">
      <dl className="grid grid-cols-3 divide-x divide-ink-100 border-b border-ink-100">
        {groupOrder.map((key) => (
          <div key={key} className="p-4 text-center">
            <dt className="text-xs text-ink-500">{groupMeta[key].label}</dt>
            <dd className={`mt-1 text-2xl font-bold ${groupMeta[key].countText}`}>
              {data[key].toLocaleString("en-IN")}
            </dd>
          </div>
        ))}
      </dl>
      {data.items.length === 0 ? (
        <div className="p-6">
          <EmptyState title="No active alerts" description="All districts are reporting normal operations." />
        </div>
      ) : (
        <ul className="divide-y divide-ink-100">
          {data.items.map((alert) => {
            const group = groupMeta[groupFor(alert.severity)];
            return (
              <li key={alert.id} className="flex items-start gap-3 p-4">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${group.dot}`} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-ink-900">
                      {alert.hospitalName} &middot; {alert.departmentName}
                    </p>
                    <span className="text-xs text-ink-400">{formatTime(alert.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-700">{alert.message}</p>
                </div>
                <Badge variant={group.variant}>{group.label}</Badge>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
