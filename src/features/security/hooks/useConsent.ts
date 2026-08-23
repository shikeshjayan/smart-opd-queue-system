"use client";

import { useCallback, useEffect, useState } from "react";
import { consentMockApi, type ConsentHistoryEntry, type ConsentRecord } from "../api/consent.mock";

export function useConsent(patientId: string) {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [history, setHistory] = useState<ConsentHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    const [c, h] = await Promise.all([consentMockApi.list(patientId), consentMockApi.history(patientId)]);
    setConsents(c);
    setHistory(h);
    setIsLoading(false);
  }, [patientId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const changeStatus = useCallback(
    async (record: Pick<ConsentRecord, "id" | "purpose" | "scopeNote">, status: "granted" | "withdrawn", actorId: string) => {
      if (status === "granted") {
        await consentMockApi.grant({
          patientId,
          purpose: record.purpose,
          grantedBy: actorId,
          scopeNote: record.scopeNote,
        });
      } else {
        await consentMockApi.withdraw(record.id, actorId);
      }
      await reload();
    },
    [patientId, reload]
  );

  return { consents, history, isLoading, changeStatus };
}
