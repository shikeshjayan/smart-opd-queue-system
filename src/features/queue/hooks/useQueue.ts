import { useState } from "react";
import { useAsync } from "@/lib/use-async";
import { queueMockApi } from "../api/queue.mock";

export function useQueue(opdId: string, tokenId: string) {
  return useAsync(() => queueMockApi.getSnapshot(opdId, tokenId), [opdId, tokenId]);
}

export function useDoctorQueue(opdId: string) {
  return useAsync(() => queueMockApi.getDoctorQueue(opdId), [opdId]);
}

export function useCallNext() {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function callNext(opdId: string) {
    setIsRunning(true);
    setError(null);
    try {
      const entry = await queueMockApi.callNext(opdId);
      return entry;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to call the next patient");
      return undefined;
    } finally {
      setIsRunning(false);
    }
  }

  return { callNext, isRunning, error };
}

export function useQueueAction() {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(
    action: "call" | "start" | "complete" | "skip",
    tokenNumber: string
  ) {
    setIsRunning(true);
    setError(null);
    try {
      if (action === "call") return await queueMockApi.callToken(tokenNumber);
      if (action === "start") return await queueMockApi.startConsultation(tokenNumber);
      if (action === "complete") return await queueMockApi.completeToken(tokenNumber);
      return await queueMockApi.skip(tokenNumber);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Action failed");
      return undefined;
    } finally {
      setIsRunning(false);
    }
  }

  return { run, isRunning, error };
}
