import type { OPDCounts, QueueEntry } from "@/types";

export type PatientQueuePhase =
  | "waiting"
  | "near_turn"
  | "called"
  | "in_consultation"
  | "completed"
  | "skipped"
  | "cancelled"
  | "no_show"
  | "expired";

export type QueueSnapshot = {
  tokenNumber: string;
  opdName: string;
  departmentName: string | null;
  doctorName: string | null;
  room: string | null;
  nowServing: string | null;
  patientsAhead: number;
  estimatedWaitMinutes: number | null;
  status: QueueEntry["status"];
  entries: QueueEntry[];
  fetchedAt: string;
};

export type DoctorQueueSnapshot = {
  opdId: string;
  opdName: string;
  current: QueueEntry | null;
  next: QueueEntry | null;
  waiting: QueueEntry[];
  counts: OPDCounts;
};

export type DisplaySnapshot = {
  hospitalName: string;
  departmentName: string | null;
  opdName: string;
  doctorName: string | null;
  room: string | null;
  nowServing: string | null;
  nextTokens: string[];
  waitingCount: number;
};
