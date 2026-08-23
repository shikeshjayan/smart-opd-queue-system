"use client";

import type { IntegrationCardData } from "../types/integration.types";
import { IntegrationCard } from "./IntegrationCard";

type IntegrationListProps = {
  providers: IntegrationCardData[];
};

export function IntegrationList({ providers }: IntegrationListProps) {
  if (providers.length === 0) {
    return <p className="text-sm text-ink-400">No integrations configured.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {providers.map((provider) => (
        <IntegrationCard key={provider.providerId} provider={provider} />
      ))}
    </div>
  );
}
