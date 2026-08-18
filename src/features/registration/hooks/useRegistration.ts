import { useEffect, useState } from "react";
import { useAsync } from "@/lib/use-async";
import { registrationMockApi } from "../api/registration.mock";
import type {
  NewPatientInput,
  RegistrationFilters,
  TokenCancelReason,
  TokenFilters,
} from "../types/registration.types";

export function useReceptionStats() {
  return useAsync(() => registrationMockApi.getStats(), []);
}

export function useRecentRegistrations() {
  return useAsync(() => registrationMockApi.recentRegistrations(), []);
}

export function usePatientSearch(query: string) {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  return useAsync(() => registrationMockApi.searchPatients(debounced), [debounced]);
}

export function usePatientActivity(patientId: string) {
  return useAsync(() => registrationMockApi.getPatientActivity(patientId), [patientId]);
}

export function useOpdAvailability(hospitalId: string) {
  return useAsync(() => registrationMockApi.listOpds(hospitalId), [hospitalId]);
}

export function useRegistrations(filters: RegistrationFilters, page: number, pageSize: number) {
  return useAsync(
    () => registrationMockApi.listRegistrations(filters, page, pageSize),
    [filters.departmentId, filters.opdId, filters.type, filters.date, page, pageSize]
  );
}

export function useTokens(filters: TokenFilters) {
  return useAsync(
    () => registrationMockApi.listTokens(filters),
    [filters.departmentId, filters.opdId, filters.status, filters.query]
  );
}

export function useDuplicateChecker() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function check(name: string, mobile: string) {
    setBusy(true);
    setError(null);
    try {
      return await registrationMockApi.findPotentialDuplicates(name, mobile);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to check for duplicates");
      return [];
    } finally {
      setBusy(false);
    }
  }

  return { check, busy, error };
}

export function useRegistrationActions() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run<T>(action: () => Promise<T>): Promise<T | null> {
    setBusy(true);
    setError(null);
    try {
      return await action();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to complete the operation");
      return null;
    } finally {
      setBusy(false);
    }
  }

  return {
    generate: (input: {
      patientId: string;
      patientName: string;
      opdId: string;
      registrationType: "walk_in" | "appointment";
      appointmentId?: string;
      isNewPatient: boolean;
    }) => run(() => registrationMockApi.generateToken(input)),
    createPatient: (input: NewPatientInput) => run(() => registrationMockApi.createPatient(input)),
    cancel: (tokenNumber: string, reason: TokenCancelReason) =>
      run(() => registrationMockApi.cancelToken(tokenNumber, reason)),
    reissue: (tokenNumber: string) => run(() => registrationMockApi.reissueToken(tokenNumber)),
    busy,
    error,
  };
}