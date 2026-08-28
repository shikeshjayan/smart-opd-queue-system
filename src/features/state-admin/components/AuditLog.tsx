"use client";

import { useMemo, useState } from "react";
import { useStateAuditLog } from "../hooks/useStateAdminData";
import type { StateAuditAction } from "../types/state-admin.types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";

const actionLabels: Record<StateAuditAction, string> = {
  announcement_published: "Announcement published",
  announcement_scheduled: "Announcement scheduled",
  announcement_cancelled: "Announcement cancelled",
  user_status_changed: "User status changed",
  user_role_changed: "User role changed",
  config_updated: "Config updated",
  report_exported: "Report exported",
  emergency_mode_toggled: "Emergency mode toggled",
  report_scheduled: "Report scheduled",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function AuditLog() {
  const { data, isLoading, error, reload } = useStateAuditLog();
  const [filter, setFilter] = useState<StateAuditAction | "all">("all");

  const actions = useMemo(() => {
    if (!data) return [] as StateAuditAction[];
    return Array.from(new Set(data.map((event) => event.action as StateAuditAction)));
  }, [data]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Could not load audit log"} onRetry={reload} />;
  }

  const filtered = filter === "all" ? data : data.filter((event) => (event.action as StateAuditAction) === filter);

  return (
    <div className="rounded-card border border-ink-200 bg-surface shadow-card overflow-hidden">
      <div className="flex flex-wrap gap-2 border-b border-ink-100 p-4">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            filter === "all" ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-700 hover:bg-ink-200"
          }`}
        >
          All
        </button>
        {actions.map((action) => (
          <button
            key={action}
            onClick={() => setFilter(action)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === action ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-700 hover:bg-ink-200"
            }`}
          >
            {actionLabels[action]}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="p-6">
          <EmptyState title="No audit events" description="No events match the selected filter." />
        </div>
      ) : (
        <ol className="relative m-4 ml-6 space-y-4 border-l border-ink-200 pl-6">
          {filtered.map((event) => (
            <li key={event.id} className="relative">
              <span
                className={`absolute -left-[29px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-surface ${
                  event.result === "success" ? "bg-status-success" : "bg-status-danger"
                }`}
                aria-hidden="true"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-ink-900">{event.summary}</p>
                <Badge variant={event.result === "success" ? "success" : "danger"}>
                  {event.result === "success" ? "Success" : "Failed"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-ink-700">
                {event.actorName} ({event.actorRole}) &middot; {actionLabels[event.action as StateAuditAction]}
              </p>
              <p className="mt-0.5 text-xs text-ink-400">{formatDateTime(event.at)}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
