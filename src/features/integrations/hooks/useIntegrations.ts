"use client";

import { useCallback, useEffect, useState } from "react";
import { integrationMockApi } from "../api/integrations.mock";
import type { IntegrationCardData, IntegrationEventRow, IntegrationHealthSummary } from "../types/integration.types";

export function useIntegrations() {
  const [providers, setProviders] = useState<IntegrationCardData[]>([]);
  const [health, setHealth] = useState<IntegrationHealthSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    const [p, h] = await Promise.all([integrationMockApi.listProviders(), integrationMockApi.getHealthSummary()]);
    setProviders(p);
    setHealth(h);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { providers, health, isLoading, reload };
}

export function useIntegrationEvents(provider?: string) {
  const [events, setEvents] = useState<IntegrationEventRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    const rows = await integrationMockApi.listEvents({ provider: provider as "health-record" | "laboratory" | "pharmacy" | "notification" | "reporting" | "identity" | undefined });
    setEvents(rows);
    setIsLoading(false);
  }, [provider]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const processOne = useCallback(
    async (eventId: string) => {
      await integrationMockApi.processEvent(eventId);
      await reload();
    },
    [reload]
  );

  const processAll = useCallback(async () => {
    await integrationMockApi.processAll();
    await reload();
  }, [reload]);

  return { events, isLoading, reload, processOne, processAll };
}
