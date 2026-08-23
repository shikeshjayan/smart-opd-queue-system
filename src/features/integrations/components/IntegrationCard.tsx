"use client";

import type { IntegrationCardData } from "../types/integration.types";
import { IntegrationStatusBadge } from "./IntegrationStatus";

type IntegrationCardProps = {
  provider: IntegrationCardData;
};

export function IntegrationCard({ provider }: IntegrationCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-ink-200 bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-ink-900">{provider.name}</h3>
          <p className="text-xs text-ink-400">{provider.version}</p>
        </div>
        <IntegrationStatusBadge status={provider.status} />
      </div>

      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-ink-400">Last sync</dt>
          <dd className="font-medium text-ink-700">
            {provider.lastSuccessfulSync
              ? new Date(provider.lastSuccessfulSync).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "Never"}
          </dd>
        </div>
        <div>
          <dt className="text-ink-400">Pending</dt>
          <dd className="font-medium text-ink-700">{provider.pendingEvents}</dd>
        </div>
        <div>
          <dt className="text-ink-400">Failed</dt>
          <dd className={`font-medium ${provider.failedEvents > 0 ? "text-status-danger" : "text-ink-700"}`}>
            {provider.failedEvents}
          </dd>
        </div>
      </dl>
    </div>
  );
}
