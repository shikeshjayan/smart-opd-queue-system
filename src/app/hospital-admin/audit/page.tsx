"use client";

import { useState } from "react";
import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import { useOpsAudit } from "@/features/hospital-admin/hooks/useHospitalOps";
import type { OperationalAuditAction } from "@/services/hospital-ops/types";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";

const ACTION_LABELS: Record<OperationalAuditAction, string> = {
  department_updated: "Department updated",
  staff_added: "Staff added",
  staff_updated: "Staff updated",
  role_assigned: "Role assigned",
  role_removed: "Role removed",
  schedule_updated: "OPD schedule updated",
  exception_created: "Schedule exception created",
  exception_resolved: "Schedule exception resolved",
  queue_config_updated: "Queue configuration changed",
  token_config_updated: "Token configuration changed",
  service_updated: "Service catalogue changed",
  opd_status_changed: "OPD status changed",
};

export default function AuditPage() {
  const { hospitalId } = useHospitalAdmin();
  const [action, setAction] = useState<OperationalAuditAction | "">("");
  const [query, setQuery] = useState("");
  const { data: events, isLoading, error, reload } = useOpsAudit(hospitalId, { action, query });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !events) {
    return <ErrorState message={error ?? "Unable to load audit activity."} onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit Activity"
        description="Operational changes made in this hospital. Clinical audit trails are separate."
      />

      <div className="flex flex-wrap items-center gap-3 rounded-card border border-ink-200 bg-surface p-3 shadow-card">
        <label className="flex items-center gap-2 text-sm text-ink-500">
          Action
          <select
            className="h-10 rounded-btn border border-ink-300 bg-surface px-3 text-sm text-ink-900 focus:outline-2 focus:outline-brand-600"
            value={action}
            onChange={(e) => setAction(e.target.value as OperationalAuditAction | "")}
          >
            <option value="">All actions</option>
            {(Object.keys(ACTION_LABELS) as OperationalAuditAction[]).map((key) => (
              <option key={key} value={key}>
                {ACTION_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-48 flex-1 items-center gap-2 text-sm text-ink-500">
          Search
          <input
            className="h-10 flex-1 rounded-btn border border-ink-300 bg-surface px-3 text-sm text-ink-900 placeholder:text-ink-400"
            placeholder="Summary or actor name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      {events.length === 0 ? (
        <EmptyState title="No audit events" description="Operational activity will appear here." />
      ) : (
        <ol className="flex flex-col">
          {events.map((event, index) => (
            <li key={event.id} className="relative flex gap-4 pb-6 pl-1 last:pb-0">
              <div className="flex w-20 shrink-0 flex-col pt-0.5 text-right">
                <span className="text-xs font-semibold tabular-nums text-ink-700">
                  {new Date(event.at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                </span>
                <span className="text-[10px] text-ink-400">
                  {new Date(event.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>
              <div className="relative flex flex-col items-center">
                <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />
                {index < events.length - 1 && <span aria-hidden="true" className="w-px flex-1 bg-ink-200" />}
              </div>
              <div className="-mt-0.5 flex-1 pb-1">
                <p className="text-sm font-medium text-ink-900">{event.summary}</p>
                <p className="mt-0.5 text-xs text-ink-500">
                  by {event.actorName} · {event.actorRole}
                </p>
                <Badge variant="default" className="mt-1.5">
                  {ACTION_LABELS[event.action] ?? event.action}
                </Badge>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
