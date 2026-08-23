"use client";

import { useState } from "react";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { useIntegrations, useIntegrationEvents } from "@/features/integrations/hooks/useIntegrations";
import { IntegrationList } from "@/features/integrations/components/IntegrationList";
import { IntegrationHealth } from "@/features/integrations/components/IntegrationHealth";
import { SyncHistory } from "@/features/integrations/components/SyncHistory";
import { FailedEvents } from "@/features/integrations/components/FailedEvents";
import { IntegrationLogs } from "@/features/integrations/components/IntegrationLogs";
import type { IntegrationEventRow } from "@/features/integrations/types/integration.types";

export default function HospitalIntegrationsPage() {
  const { providers, health, isLoading, reload } = useIntegrations();
  const { events, isLoading: eventsLoading, processOne, processAll } = useIntegrationEvents();
  const [selected, setSelected] = useState<IntegrationEventRow | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!health) {
    return <ErrorState message="Unable to load integration data." onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Integrations"
        description="Connected external healthcare systems and synchronization status."
      />

      <IntegrationHealth summary={health} />

      <IntegrationList providers={providers} />

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-900">Synchronization History</h2>
        <button
          onClick={() => void processAll()}
          className="rounded-btn border border-ink-300 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-100"
        >
          Process Queue
        </button>
      </div>

      <SyncHistory events={events} isLoading={eventsLoading} onRetry={(id) => void processOne(id)} />

      <FailedEvents events={events} onRetry={(id) => void processOne(id)} />

      <IntegrationLogs event={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
