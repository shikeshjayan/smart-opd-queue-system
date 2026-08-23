"use client";

import { Badge } from "@/components/ui/badge";

export type SecurityEvent = {
  id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  timestamp: string;
};

const SEVERITY_VARIANT = {
  info: "info",
  warning: "warning",
  critical: "danger",
} as const;

type SecurityEventsPanelProps = {
  events: SecurityEvent[];
};

export function SecurityEventsPanel({ events }: SecurityEventsPanelProps) {
  return (
    <section aria-labelledby="security-events-heading" className="rounded-card border border-ink-200 bg-surface shadow-card">
      <h2 id="security-events-heading" className="border-b border-ink-200 px-4 py-3 text-sm font-semibold text-ink-900">
        Security Events
      </h2>
      {events.length === 0 ? (
        <p className="p-4 text-sm text-ink-400">No recent security events.</p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {events.map((event) => (
            <li key={event.id} className="flex items-start gap-3 px-4 py-3">
              <span
                aria-hidden="true"
                className={event.severity === "critical" || event.severity === "warning" ? "text-status-warning" : "text-status-info"}
              >
                {event.severity === "critical" || event.severity === "warning" ? "⚠" : "✓"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink-900">{event.message}</p>
                <p className="mt-0.5 text-xs text-ink-400">
                  {new Date(event.timestamp).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <Badge variant={SEVERITY_VARIANT[event.severity]}>{event.severity}</Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
