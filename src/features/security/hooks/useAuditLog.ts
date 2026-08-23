"use client";

import { useCallback, useState } from "react";
import type { AuditEvent } from "@/types/security.types";
import { auditMockApi, type AuditFilters } from "../api/audit.mock";

export function useAuditLog() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (filters: AuditFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      setEvents(await auditMockApi.list(filters));
    } catch {
      setError("Unable to load audit log.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { events, isLoading, error, load };
}

export function recordAudit(entry: Omit<AuditEvent, "id" | "timestamp">) {
  return auditMockApi.log(entry);
}
