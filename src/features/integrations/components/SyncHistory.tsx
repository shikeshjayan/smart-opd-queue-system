"use client";

import type { IntegrationEventRow } from "../types/integration.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_VARIANT = {
  pending: "info",
  processing: "info",
  completed: "success",
  failed: "danger",
} as const;

type SyncHistoryProps = {
  events: IntegrationEventRow[];
  isLoading?: boolean;
  onRetry?: (eventId: string) => void;
};

export function SyncHistory({ events, isLoading = false, onRetry }: SyncHistoryProps) {
  if (isLoading) {
    return <p className="p-6 text-sm text-ink-400">Loading sync history…</p>;
  }

  if (events.length === 0) {
    return <p className="p-6 text-center text-sm text-ink-400">No integration events recorded yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-card border border-ink-200 bg-surface shadow-card">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-400">
            <th scope="col" className="px-4 py-3 font-medium">Provider</th>
            <th scope="col" className="px-4 py-3 font-medium">Type</th>
            <th scope="col" className="px-4 py-3 font-medium">Resource</th>
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
            <th scope="col" className="px-4 py-3 font-medium">Attempts</th>
            <th scope="col" className="px-4 py-3 font-medium">Time</th>
            {onRetry && <th scope="col" className="px-4 py-3 font-medium">Action</th>}
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="border-b border-ink-100 last:border-0 hover:bg-surface-muted">
              <td className="whitespace-nowrap px-4 py-3 font-medium text-ink-900">{event.provider}</td>
              <td className="px-4 py-3 text-ink-700">{event.type}</td>
              <td className="px-4 py-3 text-ink-500">{event.resourceId}</td>
              <td className="px-4 py-3">
                <Badge variant={STATUS_VARIANT[event.status]}>{event.status}</Badge>
              </td>
              <td className="px-4 py-3 tabular-nums text-ink-500">
                {event.attempts}/{event.maxAttempts}
              </td>
              <td className="whitespace-nowrap px-4 py-3 tabular-nums text-ink-500">
                {new Date(event.createdAt).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </td>
              {onRetry && (
                <td className="px-4 py-3">
                  {event.status === "failed" && (
                    <Button variant="outline" size="sm" onClick={() => onRetry(event.id)}>
                      Retry
                    </Button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
