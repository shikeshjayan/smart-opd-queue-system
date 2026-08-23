import {
  listQueue,
  getOpdById,
  getQueueCounts,
  orderWaitingEntries,
  callNextEntry,
  callTokenEntry,
  startConsultationEntry,
  completeTokenEntry,
  skipTokenEntry,
  getHospitalForOpd,
  getDepartmentForOpd,
  getDoctorForOpd,
} from "@/server/actions/queue";
import type { QueueEntry } from "@/types";
import { realtimeClient } from "@/features/realtime/client";
import type {
  TokenCalledEvent,
  TokenCompletedEvent,
  TokenSkippedEvent,
  TokenStartedEvent,
} from "@/features/realtime/types/realtime.types";
import type { DisplaySnapshot, DoctorQueueSnapshot, QueueSnapshot } from "../types/queue.types";
import { estimateWaitMinutes } from "../utils/waiting-time";

function emit(event: Omit<TokenCalledEvent, "type" | "at">) {
  realtimeClient.emit({ ...event, type: "TOKEN_CALLED", at: new Date().toISOString() });
}

export const queueMockApi = {
  async getSnapshot(opdId: string, tokenId: string): Promise<QueueSnapshot> {
    const [opd, entries, counts] = await Promise.all([
      getOpdById(opdId),
      listQueue(opdId),
      getQueueCounts(opdId),
    ]);

    if (!opd) {
      throw new Error("Queue information not found");
    }

    const nowServing =
      entries.find((e) => e.status === "in_consultation")?.tokenNumber ??
      entries.find((e) => e.status === "called")?.tokenNumber ??
      opd.currentlyServing;

    const orderedWaiting = await orderWaitingEntries(entries.filter((e) => e.status === "waiting"));
    const myIndex = orderedWaiting.findIndex((e) => e.tokenNumber === tokenId);
    const patientsAhead = myIndex >= 0 ? myIndex : 0;

    const department = opd.departmentId ? await getDepartmentForOpd(opdId) : null;
    const doctor = await getDoctorForOpd(opdId);

    return {
      tokenNumber: tokenId,
      opdName: opd.name,
      departmentName: department?.name ?? null,
      doctorName: doctor?.name ?? null,
      room: doctor ? `Room ${String(doctor.id).slice(-2)}` : null,
      nowServing,
      patientsAhead,
      estimatedWaitMinutes:
        counts.waiting > 0 ? estimateWaitMinutes(patientsAhead) : null,
      status: entries.find((e) => e.tokenNumber === tokenId)?.status ?? "waiting",
      entries: entries.filter((e) => e.tokenNumber >= (nowServing ?? "")),
      fetchedAt: new Date().toISOString(),
      opdStatus: opd.status,
      statusReason: opd.statusReason,
      statusUpdatedAt: opd.statusUpdatedAt,
    };
  },

  async getDoctorQueue(opdId: string): Promise<DoctorQueueSnapshot> {
    const [opd, entries, counts] = await Promise.all([
      getOpdById(opdId),
      listQueue(opdId),
      getQueueCounts(opdId),
    ]);

    if (!opd) {
      throw new Error("OPD not found");
    }

    const current =
      entries.find((e) => e.status === "in_consultation") ??
      entries.find((e) => e.status === "called") ??
      null;
    const waiting = await orderWaitingEntries(entries.filter((e) => e.status === "waiting"));
    const next = waiting[0] ?? null;

    return {
      opdId: opd.id ?? opdId,
      opdName: opd.name,
      current,
      next,
      waiting,
      counts,
      priorityCounts: {
        emergency: waiting.filter((e) => e.priority === "emergency").length,
        priority: waiting.filter((e) => e.priority === "priority").length,
        normal: waiting.filter((e) => e.priority === "normal").length,
      },
      opdStatus: opd.status,
      statusReason: opd.statusReason,
      statusUpdatedAt: opd.statusUpdatedAt,
    };
  },

  async getDisplaySnapshot(opdId: string): Promise<DisplaySnapshot> {
    const [opd, entries] = await Promise.all([
      getOpdById(opdId),
      listQueue(opdId),
    ]);

    if (!opd) {
      throw new Error("OPD not found");
    }

    const hospital = await getHospitalForOpd(opdId);
    const department = await getDepartmentForOpd(opdId);
    const doctor = await getDoctorForOpd(opdId);
    const waiting = entries.filter((e) => e.status === "waiting");
    const nowServing =
      entries.find((e) => e.status === "in_consultation")?.tokenNumber ??
      entries.find((e) => e.status === "called")?.tokenNumber ??
      opd.currentlyServing;

    return {
      hospitalName: hospital?.name ?? "Government Hospital",
      departmentName: department?.name ?? null,
      opdName: opd.name,
      doctorName: doctor?.name ?? null,
      room: doctor ? `Room ${String(doctor.id).slice(-2)}` : null,
      nowServing,
      nextTokens: waiting.slice(0, 5).map((e) => e.tokenNumber),
      waitingCount: waiting.length,
      opdStatus: opd.status,
      statusReason: opd.statusReason,
      statusUpdatedAt: opd.statusUpdatedAt,
    };
  },

  async callNext(opdId: string): Promise<QueueEntry | undefined> {
    const entry = await callNextEntry(opdId);
    if (entry) {
      emit({ opdId, tokenNumber: entry.tokenNumber, message: `Token ${entry.tokenNumber} has been called` });
    }
    return entry;
  },

  async callToken(tokenNumber: string): Promise<QueueEntry | undefined> {
    const entry = await callTokenEntry(tokenNumber);
    if (entry) {
      emit({ opdId: "opd_001", tokenNumber, message: `Token ${tokenNumber} has been called` });
    }
    return entry;
  },

  async startConsultation(tokenNumber: string): Promise<QueueEntry | undefined> {
    const entry = await startConsultationEntry(tokenNumber);
    if (entry) {
      const event: Omit<TokenStartedEvent, "at"> = {
        type: "TOKEN_STARTED",
        opdId: "opd_001",
        tokenNumber,
      };
      realtimeClient.emit({ ...event, at: new Date().toISOString() });
    }
    return entry;
  },

  async completeToken(tokenNumber: string): Promise<QueueEntry | undefined> {
    const entry = await completeTokenEntry(tokenNumber);
    if (entry) {
      const event: Omit<TokenCompletedEvent, "at"> = {
        type: "TOKEN_COMPLETED",
        opdId: "opd_001",
        tokenNumber,
      };
      realtimeClient.emit({ ...event, at: new Date().toISOString() });
    }
    return entry;
  },

  async skip(tokenNumber: string): Promise<QueueEntry | undefined> {
    const entry = await skipTokenEntry(tokenNumber);
    if (entry) {
      const event: Omit<TokenSkippedEvent, "at"> = {
        type: "TOKEN_SKIPPED",
        opdId: "opd_001",
        tokenNumber,
      };
      realtimeClient.emit({ ...event, at: new Date().toISOString() });
    }
    return entry;
  },
};
