import type { QueueEntry, Token } from "@/types";
import {
  countQueueStatuses,
  getActiveToken,
  listQueue,
  mockTokens,
  setQueueEntryStatus,
} from "../data";

const delay = () => new Promise((resolve) => setTimeout(resolve, 300));

export const queueService = {
  async list(opdId: string): Promise<QueueEntry[]> {
    await delay();
    return listQueue(opdId);
  },

  async getStatus(tokenId: string): Promise<Token | undefined> {
    await delay();
    return mockTokens.find((t) => t.id === tokenId);
  },

  async getActiveToken(patientId: string): Promise<Token | undefined> {
    await delay();
    return getActiveToken(patientId);
  },

  async callNext(opdId: string): Promise<QueueEntry | undefined> {
    await delay();
    const next = listQueue(opdId).find((q) => q.status === "waiting");
    if (next) setQueueEntryStatus(next.tokenNumber, "called");
    return next ? { ...next, status: "called" as const } : undefined;
  },

  async callToken(tokenNumber: string): Promise<QueueEntry | undefined> {
    await delay();
    const entry = listQueue("opd_001").find(
      (q) => q.tokenNumber === tokenNumber && q.status === "waiting"
    );
    if (entry) setQueueEntryStatus(tokenNumber, "called");
    return entry ? { ...entry, status: "called" as const } : undefined;
  },

  async startConsultation(tokenNumber: string): Promise<QueueEntry | undefined> {
    await delay();
    const entry = listQueue("opd_001").find((q) => q.tokenNumber === tokenNumber);
    if (entry) setQueueEntryStatus(tokenNumber, "in_consultation");
    return entry ? { ...entry, status: "in_consultation" as const } : undefined;
  },

  async complete(tokenNumber: string): Promise<QueueEntry | undefined> {
    await delay();
    const entry = listQueue("opd_001").find((q) => q.tokenNumber === tokenNumber);
    if (entry) setQueueEntryStatus(tokenNumber, "completed");
    return entry ? { ...entry, status: "completed" as const } : undefined;
  },

  async skip(tokenNumber: string): Promise<QueueEntry | undefined> {
    await delay();
    const entry = listQueue("opd_001").find((q) => q.tokenNumber === tokenNumber);
    if (entry) setQueueEntryStatus(tokenNumber, "skipped");
    return entry ? { ...entry, status: "skipped" as const } : undefined;
  },

  async counts(opdId: string) {
    await delay();
    return countQueueStatuses(opdId);
  },

  async advance(tokenId: string): Promise<Token | undefined> {
    await delay();
    const token = mockTokens.find((t) => t.id === tokenId);
    if (token) {
      token.status = "in_consultation";
      token.patientsAhead = 0;
    }
    return token;
  },
};
