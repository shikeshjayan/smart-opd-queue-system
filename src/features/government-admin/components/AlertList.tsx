import type { GovernmentAlert } from "@/types";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/empty-state";

type AlertListProps = {
  alerts: GovernmentAlert[];
  limit?: number;
};

const severityVariant = {
  critical: "danger",
  warning: "warning",
  info: "info",
} as const;

const severityLabel = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
} as const;

const typeLabel: Record<GovernmentAlert["type"], string> = {
  doctor_unavailable: "Doctor unavailable",
  queue_above_threshold: "Queue threshold",
  long_wait: "Long wait",
  opd_full: "OPD full",
  system: "System",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function AlertList({ alerts, limit }: AlertListProps) {
  const visible = limit ? alerts.slice(0, limit) : alerts;

  if (visible.length === 0) {
    return <EmptyState title="No alerts" description="There are no alerts to show right now." />;
  }

  return (
    <section aria-labelledby="alert-list-title">
      <h2 id="alert-list-title" className="mb-3 text-lg font-semibold text-ink-900">
        Alerts
      </h2>
      <ul className="flex flex-col gap-3">
        {visible.map((alert) => (
          <li
            key={alert.id}
            className={`rounded-card border p-4 shadow-card ${
              alert.severity === "critical"
                ? "border-status-danger-soft bg-status-danger-soft"
                : alert.severity === "warning"
                  ? "border-status-warning-soft bg-status-warning-soft"
                  : "border-status-info-soft bg-status-info-soft"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    alert.severity === "critical"
                      ? "bg-status-danger"
                      : alert.severity === "warning"
                        ? "bg-status-warning"
                        : "bg-status-info"
                  }`}
                  aria-hidden="true"
                />
                <h3 className="font-semibold text-ink-900">
                  {alert.hospitalName} &middot; {alert.departmentName}
                </h3>
                <Badge variant={severityVariant[alert.severity]}>
                  {severityLabel[alert.severity]}
                </Badge>
              </div>
              <span className="text-xs text-ink-400">{formatTime(alert.createdAt)}</span>
            </div>
            <p className="mt-2 text-sm text-ink-700">{alert.message}</p>
            <p className="mt-1 text-xs font-medium text-ink-500">{typeLabel[alert.type]}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
