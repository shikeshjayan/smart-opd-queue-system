"use client";

import type { IntegrationEventRow } from "../types/integration.types";
import { Button } from "@/components/ui/button";

type FailedEventsProps = {
  events: IntegrationEventRow[];
  onRetry?: (eventId: string) => void;
};

export function FailedEvents({ events, onRetry }: FailedEventsProps) {
  const failed = events.filter((e) => e.status === "failed");

  return (
    <section aria-labelledby="failed-events-heading" className="rounded-card border border-ink-200 bg-surface shadow-card">
      <h2 id="failed-events-heading" className="border-b border-ink-200 px-4 py-3 text-sm font-semibold text-ink-900">
        Failed Integrations
      </h2>
      {failed.length === 0 ? (
        <p className="p-4 text-sm text-ink-400">No failed integration events.</p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {failed.map((event) => (
            <li key={event.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-900">{event.type}</p>
                <p className="mt-0.5 text-xs text-ink-500">
                  {event.provider} · {event.resourceId}
                </p>
                {event.failedReason && (
                  <p className="mt-1 text-xs text-status-danger">{event.failedReason}</p>
                )}
                <p className="mt-0.5 text-xs text-ink-400">
                  Attempts: {event.attempts}/{event.maxAttempts}
                  {event.nextRetryAt && (
                    <> · Next retry: {new Date(event.nextRetryAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</>
                  )}
                </p>
              </div>
              {onRetry && event.attempts < event.maxAttempts && (
                <Button variant="outline" size="sm" onClick={() => onRetry(event.id)}>
                  Retry
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
