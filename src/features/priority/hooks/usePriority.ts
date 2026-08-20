"use client";

import { useEffect, useRef, useState } from "react";
import { useAsync } from "@/lib/use-async";
import { useRealtime } from "@/features/realtime/hooks/useRealtime";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { priorityMockApi } from "../api/priority.mock";
import type {
  AssistanceStatus,
  AssistanceType,
  OverrideStatus,
  PriorityLevel,
} from "../types/priority.types";

export function useAssessmentList(hospitalId: string) {
  const { data, isLoading, error, reload } = useAsync(
    () => priorityMockApi.getAssessmentList(hospitalId),
    [hospitalId]
  );
  const { subscribe } = useRealtime();
  const reloadRef = useRef(reload);
  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

  useEffect(() => {
    return subscribe("*", () => reloadRef.current());
  }, [subscribe]);

  return { data, isLoading, error, reload };
}

export function usePriorityAction() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function assignPriority(input: {
    opdId: string;
    tokenNumber: string;
    patientId: string | null;
    patientName: string | null;
    level: PriorityLevel;
    notes?: string;
  }) {
    setIsRunning(true);
    setError(null);
    try {
      return await priorityMockApi.assignPriority({
        ...input,
        assessedById: user?.id ?? "unknown",
        assessedBy: user?.name ?? "Clinical Staff",
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to assign priority");
      return undefined;
    } finally {
      setIsRunning(false);
    }
  }

  return { assignPriority, isRunning, error };
}

export function usePriorityAudit() {
  return useAsync(() => priorityMockApi.listAudit(), []);
}

export function useAssistance() {
  const { data, isLoading, error, reload } = useAsync(
    () => priorityMockApi.listAssistance(),
    []
  );
  const [isRunning, setIsRunning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function updateStatus(id: string, status: AssistanceStatus, assignedTo?: string) {
    setIsRunning(true);
    setActionError(null);
    try {
      const result = await priorityMockApi.updateAssistanceStatus(id, status, assignedTo);
      if (result) reload();
      return result;
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Action failed");
      return undefined;
    } finally {
      setIsRunning(false);
    }
  }

  return { data, isLoading, error, reload, updateStatus, isRunning, actionError };
}

export function useAssistanceActions() {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function request(input: { patientId: string; patientName: string; type: AssistanceType }) {
    setIsRunning(true);
    setError(null);
    try {
      return await priorityMockApi.requestAssistance(input);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to request assistance");
      return undefined;
    } finally {
      setIsRunning(false);
    }
  }

  return { request, isRunning, error };
}

export function useOverrides(filters: { status?: OverrideStatus } = {}) {
  const { data, isLoading, error, reload } = useAsync(
    () => priorityMockApi.listOverrides(filters),
    [filters.status]
  );
  const { subscribe } = useRealtime();
  const reloadRef = useRef(reload);
  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

  useEffect(() => {
    return subscribe("*", () => reloadRef.current());
  }, [subscribe]);

  return { data, isLoading, error, reload };
}

export function useOverrideActions() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function request(input: {
    opdId: string;
    tokenNumber: string;
    patientId: string | null;
    patientName: string | null;
    reason: string;
  }) {
    setIsRunning(true);
    setError(null);
    try {
      return await priorityMockApi.requestOverride({
        ...input,
        requestedById: user?.id ?? "unknown",
        requestedBy: user?.name ?? "Staff",
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to request override");
      return undefined;
    } finally {
      setIsRunning(false);
    }
  }

  async function approve(id: string) {
    setIsRunning(true);
    setError(null);
    try {
      return await priorityMockApi.approveOverride(id, user?.name ?? "Admin", user?.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to approve");
      return undefined;
    } finally {
      setIsRunning(false);
    }
  }

  async function reject(id: string, note?: string) {
    setIsRunning(true);
    setError(null);
    try {
      return await priorityMockApi.rejectOverride(id, user?.name ?? "Admin", note, user?.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to reject");
      return undefined;
    } finally {
      setIsRunning(false);
    }
  }

  return { request, approve, reject, isRunning, error };
}
