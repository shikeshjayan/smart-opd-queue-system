"use client";

import { useEffect, useState } from "react";
import { recordAccessService, type RecordAccessEvent } from "@/services/medical-records/record-access";
import { Badge } from "@/components/ui/badge";

const ACTION_VARIANT = {
  viewed: "info",
  exported: "warning",
  created: "success",
  modified: "default",
  deleted: "danger",
} as const;

type RecordAccessHistoryProps = {
  patientId: string;
};

export function RecordAccessHistory({ patientId }: RecordAccessHistoryProps) {
  const [events, setEvents] = useState<RecordAccessEvent[]>([]);

  useEffect(() => {
    setEvents(recordAccessService.listForPatient(patientId));
  }, [patientId]);

  if (events.length === 0) {
    return (
      <p className="rounded-card border border-ink-200 bg-surface p-4 text-center text-sm text-ink-400 shadow-card">
        No record access history yet.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {events.map((event) => (
        <li key={event.id} className="flex items-center justify-between gap-3 rounded-card border border-ink-100 bg-surface p-3 text-sm">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink-900">
              {event.actorName}
              <span className="ml-2 text-xs text-ink-400">{event.actorRole}</span>
            </p>
            <p className="text-ink-500">
              {event.action} {event.resourceType}
            </p>
          </div>
          <Badge variant={ACTION_VARIANT[event.action]}>{event.action}</Badge>
          <span className="shrink-0 tabular-nums text-xs text-ink-400">
            {new Date(event.timestamp).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </li>
      ))}
    </ol>
  );
}
