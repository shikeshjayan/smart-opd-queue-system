"use client";

import { useEffect, useRef } from "react";
import { useAsync } from "@/lib/use-async";
import { useRealtime } from "@/features/realtime/hooks/useRealtime";
import { queueMockApi } from "../api/queue.mock";
import { NEAR_TURN_AHEAD } from "../config";
import type { DoctorQueueSnapshot, PatientQueuePhase, QueueSnapshot } from "../types/queue.types";

function derivePhase(status: QueueSnapshot["status"], patientsAhead: number): PatientQueuePhase {
  if (status === "waiting") {
    return patientsAhead <= NEAR_TURN_AHEAD ? "near_turn" : "waiting";
  }
  return status;
}

export function useQueueRealtime(opdId: string, tokenId: string) {
  const { data, isLoading, error, reload } = useAsync(
    () => queueMockApi.getSnapshot(opdId, tokenId),
    [opdId, tokenId]
  );
  const { status: connection, subscribe } = useRealtime();
  const reloadRef = useRef(reload);
  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

  useEffect(() => {
    return subscribe("*", (event) => {
      if (event.type === "CONNECTION_CHANGED" || ("opdId" in event && event.opdId === opdId)) {
        reloadRef.current();
      }
    });
  }, [subscribe, opdId]);

  const phase: PatientQueuePhase | null = data
    ? derivePhase(data.status, data.patientsAhead)
    : null;

  return { data, isLoading, error, reload, connection, phase };
}

export function useDoctorQueueRealtime(opdId: string) {
  const { data, isLoading, error, reload } = useAsync(
    () => (opdId ? queueMockApi.getDoctorQueue(opdId) : Promise.resolve(null)),
    [opdId]
  );
  const { status: connection, subscribe } = useRealtime();
  const reloadRef = useRef(reload);
  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

  useEffect(() => {
    return subscribe("*", (event) => {
      if (event.type === "CONNECTION_CHANGED" || ("opdId" in event && event.opdId === opdId)) {
        reloadRef.current();
      }
    });
  }, [subscribe, opdId]);

  return { data: data as DoctorQueueSnapshot | null, isLoading, error, reload, connection };
}