import { opdService } from "@/services/opd";
import { queueService } from "@/services/queue";
import type { QueueEntry } from "@/types";
import type { DoctorQueueSnapshot, QueueSnapshot } from "../types/queue.types";

export const queueMockApi = {
  async getSnapshot(opdId: string, tokenId: string): Promise<QueueSnapshot> {
    const [opd, token, entries] = await Promise.all([
      opdService.getById(opdId),
      queueService.getStatus(tokenId),
      queueService.list(opdId),
    ]);

    if (!opd || !token) {
      throw new Error("Queue information not found");
    }

    const nowServing = opd.currentlyServing;
    const startIndex = nowServing
      ? Math.max(0, entries.findIndex((e) => e.tokenNumber === nowServing))
      : 0;
    const visibleEntries = entries.slice(startIndex);

    return {
      tokenNumber: token.tokenNumber,
      opdName: opd.name,
      nowServing,
      patientsAhead: token.patientsAhead,
      estimatedWaitMinutes: token.estimatedWaitMinutes ?? opd.estimatedWaitMinutes,
      status: token.status,
      entries: visibleEntries,
    };
  },

  async getDoctorQueue(opdId: string): Promise<DoctorQueueSnapshot> {
    const [opd, entries, counts] = await Promise.all([
      opdService.getById(opdId),
      queueService.list(opdId),
      queueService.counts(opdId),
    ]);

    if (!opd) {
      throw new Error("OPD not found");
    }

    const current =
      entries.find((e) => e.status === "in_consultation") ??
      entries.find((e) => e.status === "called") ??
      null;
    const waiting = entries.filter((e) => e.status === "waiting");
    const next = waiting[0] ?? null;

    return {
      opdId: opd.id,
      opdName: opd.name,
      current,
      next,
      waiting,
      counts,
    };
  },

  async callNext(opdId: string): Promise<QueueEntry | undefined> {
    return queueService.callNext(opdId);
  },

  async callToken(tokenNumber: string): Promise<QueueEntry | undefined> {
    return queueService.callToken(tokenNumber);
  },

  async startConsultation(tokenNumber: string): Promise<QueueEntry | undefined> {
    return queueService.startConsultation(tokenNumber);
  },

  async completeToken(tokenNumber: string): Promise<QueueEntry | undefined> {
    return queueService.complete(tokenNumber);
  },

  async skip(tokenNumber: string): Promise<QueueEntry | undefined> {
    return queueService.skip(tokenNumber);
  },
};
