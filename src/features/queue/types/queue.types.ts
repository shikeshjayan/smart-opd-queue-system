import type { OPDCounts, QueueEntry } from "@/types";

export type QueueSnapshot = {
  tokenNumber: string;
  opdName: string;
  nowServing: string | null;
  patientsAhead: number;
  estimatedWaitMinutes: number | null;
  status: QueueEntry["status"];
  entries: QueueEntry[];
};

export type DoctorQueueSnapshot = {
  opdId: string;
  opdName: string;
  current: QueueEntry | null;
  next: QueueEntry | null;
  waiting: QueueEntry[];
  counts: OPDCounts;
};
