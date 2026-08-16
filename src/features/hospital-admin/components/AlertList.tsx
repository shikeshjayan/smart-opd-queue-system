import type { AdminNotification } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "../utils/format";

const typeConfig: Record<AdminNotification["type"], { label: string; variant: "success" | "warning" | "danger" | "info" | "default" }> = {
  queue: { label: "Queue", variant: "info" },
  system: { label: "System", variant: "default" },
  alert: { label: "Alert", variant: "danger" },
  info: { label: "Info", variant: "success" },
};

type AlertListProps = {
  alerts: AdminNotification[];
};

export function AlertList({ alerts }: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <section
        aria-labelledby="alerts-title"
        className="rounded-card border border-ink-200 bg-surface p-5 shadow-card"
      >
        <h2 id="alerts-title" className="text-lg font-semibold text-ink-900">
          Alerts
        </h2>
        <p className="mt-2 text-sm text-ink-500">No active alerts. All clear.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="alerts-title">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="alerts-title" className="text-lg font-semibold text-ink-900">
          Alerts
        </h2>
        <Badge variant="danger">{alerts.length} new</Badge>
      </div>
      <ul className="flex flex-col gap-2">
        {alerts.map((alert) => {
          const { label, variant } = typeConfig[alert.type];
          return (
            <li
              key={alert.id}
              className="rounded-card border border-ink-200 bg-surface p-4 shadow-card"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={variant}>{label}</Badge>
                    <p className="text-sm font-semibold text-ink-900">{alert.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-ink-700">{alert.message}</p>
                  <p className="mt-1 text-xs text-ink-400">{formatDateTime(alert.createdAt)}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
