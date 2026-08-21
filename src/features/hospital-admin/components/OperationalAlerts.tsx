import type { OperationalAlert } from "@/services/hospital-ops/types";

const SEVERITY_STYLES: Record<OperationalAlert["severity"], string> = {
  critical: "border-status-danger bg-status-danger-soft text-status-danger",
  warning: "border-status-warning bg-status-warning-soft text-status-warning",
  info: "border-status-info bg-status-info-soft text-status-info",
};

const TYPE_ICONS: Record<OperationalAlert["type"], string> = {
  queue_delay: "⏱",
  lab_backlog: "🧪",
  doctor_unavailable: "🩺",
  opd_cancelled: "⚠",
};

export function OperationalAlerts({ alerts }: { alerts: OperationalAlert[] }) {
  if (alerts.length === 0) {
    return (
      <section aria-labelledby="alerts-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <h2 id="alerts-title" className="text-lg font-semibold text-ink-900">
          Operational Alerts
        </h2>
        <p className="mt-2 text-sm text-ink-500">No operational alerts right now.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="alerts-title" className="flex flex-col gap-3">
      <h2 id="alerts-title" className="text-lg font-semibold text-ink-900">
        Operational Alerts
        <span className="ml-2 rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-600">
          {alerts.length}
        </span>
      </h2>
      <ul className="flex flex-col gap-2">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className={`flex items-start gap-3 rounded-card border p-3 shadow-card ${SEVERITY_STYLES[alert.severity]}`}
          >
            <span aria-hidden="true" className="text-lg leading-none">
              {TYPE_ICONS[alert.type]}
            </span>
            <div>
              <p className="font-semibold">{alert.title}</p>
              <p className="text-sm opacity-80">{alert.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
