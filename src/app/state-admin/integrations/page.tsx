"use client";

import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { useIntegrations } from "@/features/integrations/hooks/useIntegrations";
import { IntegrationList } from "@/features/integrations/components/IntegrationList";
import { IntegrationHealth } from "@/features/integrations/components/IntegrationHealth";

export default function StateIntegrationsPage() {
  const { providers, health, isLoading, reload } = useIntegrations();

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
        title="Integration Health"
        description="Cross-hospital integration status overview. Monitors all approved external healthcare system connections."
      />

      <IntegrationHealth summary={health} />

      <IntegrationList providers={providers} />
    </div>
  );
}
