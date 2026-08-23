"use client";

import { useEffect, useState } from "react";
import type { AuditEvent } from "@/types/security.types";
import { RoleGuard } from "@/features/auth/components/RoleGuard";
import { AuditLogTable } from "@/features/security/components/AuditLogTable";
import {
  SecurityEventsPanel,
  type SecurityEvent,
} from "@/features/security/components/SecurityEventsPanel";
import { auditMockApi } from "@/features/security/api/audit.mock";

const ACTION_OPTIONS = [
  "LOGIN",
  "LOGOUT",
  "VIEW_PATIENT_RECORD",
  "CREATE_PRESCRIPTION",
  "FINALIZE_DIAGNOSTIC_RESULT",
  "UPDATE_STAFF_ROLE",
  "EXPORT_REPORT",
] as const;

const seedSecurityEvents: SecurityEvent[] = [
  {
    id: "sec_001",
    type: "failed_login",
    severity: "warning",
    message: "Failed login attempt for staff id “unknown”.",
    timestamp: new Date(Date.now() - 90 * 60_000).toISOString(),
  },
  {
    id: "sec_002",
    type: "role_updated",
    severity: "info",
    message: "Role updated for staff account stf_003.",
    timestamp: new Date(Date.now() - 42 * 60_000).toISOString(),
  },
];

function AuditDashboard() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [result, setResult] = useState<"" | AuditEvent["result"]>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const rows = await auditMockApi.list({ actor, action, result, dateFrom, dateTo });
        if (!cancelled) setEvents(rows);
      } catch {
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [actor, action, result, dateFrom, dateTo]);

  const inputClass =
    "h-10 rounded-btn border border-ink-300 bg-surface px-3 text-sm text-ink-900 focus:outline-2 focus:outline-brand-600";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-xl font-semibold text-ink-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-ink-500">
          Security, clinical and governance activity. Entries are immutable and retained for review.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-3 rounded-card border border-ink-200 bg-surface p-3 shadow-card">
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-500">
          Actor
          <input
            className={`${inputClass} min-w-44`}
            placeholder="Name or id"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-500">
          Action
          <select className={inputClass} value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">All actions</option>
            {ACTION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-500">
          Result
          <select
            className={inputClass}
            value={result}
            onChange={(e) => setResult(e.target.value as "" | AuditEvent["result"])}
          >
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="denied">Denied</option>
            <option value="failure">Failure</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-500">
          From
          <input type="date" className={inputClass} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-ink-500">
          To
          <input type="date" className={inputClass} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
      </div>

      <AuditLogTable events={events} isLoading={isLoading} />

      <SecurityEventsPanel events={seedSecurityEvents} />
    </main>
  );
}

export default function AuditPage() {
  return (
    <RoleGuard roles={["hospital_admin", "district_admin", "state_admin"]} expiredMode="inline">
      <AuditDashboard />
    </RoleGuard>
  );
}
