"use client";

import type { AuditEvent } from "@/types/security.types";
import { Badge } from "@/components/ui/badge";

const RESULT_VARIANT: Record<AuditEvent["result"], "success" | "warning" | "danger"> = {
  success: "success",
  denied: "warning",
  failure: "danger",
};

type AuditLogTableProps = {
  events: AuditEvent[];
  isLoading?: boolean;
};

export function AuditLogTable({ events, isLoading = false }: AuditLogTableProps) {
  if (isLoading) {
    return <p className="p-6 text-sm text-ink-400">Loading audit log…</p>;
  }

  if (events.length === 0) {
    return <p className="p-6 text-center text-sm text-ink-400">No audit events match the selected filters.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-card border border-ink-200 bg-surface shadow-card">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-400">
            <th scope="col" className="px-4 py-3 font-medium">Actor</th>
            <th scope="col" className="px-4 py-3 font-medium">Action</th>
            <th scope="col" className="px-4 py-3 font-medium">Resource</th>
            <th scope="col" className="px-4 py-3 font-medium">Time</th>
            <th scope="col" className="px-4 py-3 font-medium">Result</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="border-b border-ink-100 last:border-0 hover:bg-surface-muted">
              <td className="whitespace-nowrap px-4 py-3">
                <span className="font-medium text-ink-900">{event.actorName}</span>
                <span className="ml-2 text-xs text-ink-400">{event.actorRole}</span>
              </td>
              <td className="px-4 py-3 text-ink-700">{event.action}</td>
              <td className="px-4 py-3 text-ink-500">
                {event.resourceType}
                <span className="ml-1.5 text-xs text-ink-400">{event.resourceId}</span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 tabular-nums text-ink-500">
                {new Date(event.timestamp).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-4 py-3">
                <Badge variant={RESULT_VARIANT[event.result]}>{event.result.toUpperCase()}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
