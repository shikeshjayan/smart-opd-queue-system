"use client";

import type { IntegrationHealthSummary } from "../types/integration.types";

type IntegrationHealthProps = {
  summary: IntegrationHealthSummary;
};

export function IntegrationHealth({ summary }: IntegrationHealthProps) {
  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">Providers</dt>
        <dd className="mt-1 text-2xl font-semibold text-ink-900">{summary.totalProviders}</dd>
      </div>
      <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">Healthy</dt>
        <dd className="mt-1 text-2xl font-semibold text-status-success">{summary.healthyProviders}</dd>
      </div>
      <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">Pending</dt>
        <dd className="mt-1 text-2xl font-semibold text-ink-900">{summary.totalPending}</dd>
      </div>
      <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">Failed</dt>
        <dd className={`mt-1 text-2xl font-semibold ${summary.totalFailed > 0 ? "text-status-danger" : "text-ink-900"}`}>
          {summary.totalFailed}
        </dd>
      </div>
    </dl>
  );
}
