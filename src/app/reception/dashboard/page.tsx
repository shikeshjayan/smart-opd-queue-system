"use client";

import Link from "next/link";
import { TokenStatus } from "@/features/token/components/TokenStatus";
import { useReceptionStats, useRecentRegistrations } from "@/features/registration/hooks/useRegistration";
import { useReception } from "@/features/registration/reception-context";
import { formatDate } from "@/features/medical-records/utils/format";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";

const quickActions = [
  { label: "Register Patient", description: "New or existing patient", href: "/reception/registration", shortcut: "F2" },
  { label: "Find Patient", description: "Search across hospitals", href: "/reception/patients", shortcut: "Ctrl+K" },
  { label: "Today's Tokens", description: "View and manage tokens", href: "/reception/tokens" },
  { label: "Live Queue", description: "Monitor current queue", href: "/reception/queue" },
  { label: "Registration History", description: "Filter past registrations", href: "/reception/history" },
];

export default function ReceptionDashboardPage() {
  const { hospital, counter, receptionistName, active } = useReception();
  const stats = useReceptionStats();
  const recent = useRecentRegistrations();

  const statItems = stats.data
    ? [
        { id: "new", label: "New Patients", value: stats.data.newPatients },
        { id: "existing", label: "Existing Patients", value: stats.data.existingPatients },
        { id: "total", label: "Total", value: stats.data.total },
        { id: "tokens", label: "Tokens Generated", value: stats.data.tokensGenerated },
        { id: "cancelled", label: "Cancelled", value: stats.data.cancelled },
        { id: "waiting", label: "Waiting", value: stats.data.waiting },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Reception Desk</h1>
          <p className="mt-1 text-sm text-ink-500">{hospital?.name ?? "Loading hospital..."}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-ink-200 bg-surface px-4 py-2 text-sm text-ink-700">
          <span className={`h-2 w-2 rounded-full ${active ? "bg-status-success" : "bg-ink-300"}`} aria-hidden="true" />
          Counter {counter} &middot; {receptionistName} &middot; {active ? "Active" : "Offline"}
        </div>
      </div>

      <p className="rounded-card border border-status-info-soft bg-status-info-soft px-4 py-3 text-xs text-status-info">
        Keyboard shortcuts: <span className="font-medium">Ctrl+K</span> search patient &middot;{" "}
        <span className="font-medium">F2</span> new registration
      </p>

      <section aria-labelledby="today-stats-title">
        <h2 id="today-stats-title" className="text-lg font-semibold text-ink-900">
          Today&apos;s Registrations
        </h2>
        {stats.isLoading ? (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}
          </div>
        ) : stats.error ? (
          <ErrorState message={stats.error} onRetry={stats.reload} />
        ) : (
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {statItems.map((item) => (
              <div key={item.id} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
                <dt className="text-xs text-ink-500">{item.label}</dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums text-ink-900">
                  {typeof item.value === "number" ? item.value.toLocaleString("en-IN") : item.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section aria-labelledby="quick-actions-title">
        <h2 id="quick-actions-title" className="text-lg font-semibold text-ink-900">
          Quick Actions
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="rounded-card border border-ink-200 bg-surface p-4 shadow-card transition-colors hover:border-brand-600"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-ink-900">{action.label}</p>
                {action.shortcut && (
                  <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-500">
                    {action.shortcut}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-ink-500">{action.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="recent-registrations-title">
        <div className="flex items-center justify-between gap-2">
          <h2 id="recent-registrations-title" className="text-lg font-semibold text-ink-900">
            Recent Registrations
          </h2>
          <Link href="/reception/history" className="text-sm font-medium text-brand-700 hover:underline">
            View All
          </Link>
        </div>
        {recent.isLoading ? (
          <div className="mt-3 flex flex-col gap-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : recent.error ? (
          <ErrorState message={recent.error} onRetry={recent.reload} />
        ) : recent.data && recent.data.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2">
            {recent.data.map((record) => (
              <li
                key={record.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-ink-200 bg-surface p-3 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold tabular-nums text-brand-700">
                    {record.tokenNumber}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink-900">{record.patientName}</p>
                    <p className="text-xs text-ink-500">
                      {record.departmentName} &middot; {formatDate(record.createdAt.slice(0, 10))}{" "}
                      {record.createdAt.slice(11, 16)}
                    </p>
                  </div>
                </div>
                <TokenStatus
                  status={record.status === "cancelled" ? "cancelled" : "waiting"}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-500">No registrations today yet.</p>
        )}
      </section>
    </div>
  );
}