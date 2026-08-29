"use client";

import { useCallback, useState } from "react";
import { medicalRecordsRealApi } from "@/features/medical-records/api/medical-records.api";
import type { PatientEncounter } from "@/features/medical-records/types/medical-record.types";

export function usePatientSearch() {
  const [results, setResults] = useState<PatientEncounter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");

  const search = useCallback(async (q: string, hospitalId?: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const rows = await medicalRecordsRealApi.searchPatients(q, hospitalId);
      setResults(rows);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
  }, []);

  return { results, isLoading, query, search, clear };
}
