"use client";

import {
  callNextEntry,
  startConsultationEntry,
  completeTokenEntry,
  skipTokenEntry,
  listQueue,
  getOpdById,
  getQueueCounts,
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
    const [opd, entries] = await Promise.all([
      getOpdById(opdId),
      listQueue(opdId),
    ]);

    const typedEntries = entries as QueueEntry[];
    const nowServing =
      typedEntries.find((e) => e.status === "in_consultation")?.tokenNumber ??
      typedEntries.find((e) => e.status === "called")?.tokenNumber ??
      (opd as any)?.currentlyServing;

    const waiting = typedEntries.filter((e) => e.status === "waiting");
    const myIndex = waiting.findIndex((e) => e.tokenNumber === tokenId);
    const patientsAhead = myIndex >= 0 ? myIndex : waiting.length;

    const department = await getDepartmentForOpd(opdId);
    const doctor = await getDoctorForOpd(opdId);

    return {
      tokenNumber: tokenId,
      opdName: (opd as any)?.name ?? "OPD",
      departmentName: (department as any)?.name ?? null,
      doctorName: (doctor as any)?.name ?? null,
      room: doctor ? `Room ${String((doctor as any)?.id ?? "").slice(-2)}` : null,
      nowServing,
      patientsAhead,
      estimatedWaitMinutes: patientsAhead > 0 ? estimateWaitMinutes(patientsAhead) : null,
      status: typedEntries.find((e) => e.tokenNumber === tokenId)?.status ?? "waiting",
      entries: typedEntries,
      fetchedAt: new Date().toISOString(),
      opdStatus: (opd as any)?.status ?? "open",
      statusReason: (opd as any)?.statusReason,
      statusUpdatedAt: (opd as any)?.statusUpdatedAt,
    };
  },

  async getDoctorQueue(opdId: string): Promise<DoctorQueueSnapshot> {
    const [opd, entries, counts] = await Promise.all([
      getOpdById(opdId),
      listQueue(opdId),
      getQueueCounts(opdId),
    ]);

    const typedEntries = entries as QueueEntry[];
    const current =
      typedEntries.find((e) => e.status === "in_consultation") ??
      typedEntries.find((e) => e.status === "called") ??
      null;
    const waiting = typedEntries.filter((e) => e.status === "waiting");
    const next = waiting[0] ?? null;

    return {
      opdId: (opd as any)?.id ?? opdId,
      opdName: (opd as any)?.name ?? "OPD",
      current,
      next,
      waiting,
      counts,
      priorityCounts: {
        emergency: waiting.filter((e) => e.priority === "emergency").length,
        priority: waiting.filter((e) => e.priority === "priority").length,
        normal: waiting.filter((e) => e.priority === "normal").length,
      },
      opdStatus: (opd as any)?.status ?? "open",
      statusReason: (opd as any)?.statusReason,
      statusUpdatedAt: (opd as any)?.statusUpdatedAt,
    };
  },

  async getDisplaySnapshot(opdId: string): Promise<DisplaySnapshot> {
    const [opd, entries] = await Promise.all([
      getOpdById(opdId),
      listQueue(opdId),
    ]);

    const typedEntries = entries as QueueEntry[];
    const hospital = await getHospitalForOpd(opdId);
    const department = await getDepartmentForOpd(opdId);
    const doctor = await getDoctorForOpd(opdId);
    const waiting = typedEntries.filter((e) => e.status === "waiting");
    const nowServing =
      typedEntries.find((e) => e.status === "in_consultation")?.tokenNumber ??
      typedEntries.find((e) => e.status === "called")?.tokenNumber ??
      (opd as any)?.currentlyServing;

    return {
      hospitalName: (hospital as any)?.name ?? "Government Hospital",
      departmentName: (department as any)?.name ?? null,
      opdName: (opd as any)?.name ?? "OPD",
      doctorName: (doctor as any)?.name ?? null,
      room: doctor ? `Room ${String((doctor as any)?.id ?? "").slice(-2)}` : null,
      nowServing,
      nextTokens: waiting.slice(0, 5).map((e) => e.tokenNumber),
      waitingCount: waiting.length,
      opdStatus: (opd as any)?.status ?? "open",
      statusReason: (opd as any)?.statusReason,
      statusUpdatedAt: (opd as any)?.statusUpdatedAt,
    };
  },

  async callNext(opdId: string): Promise<QueueEntry | undefined> {
    const entry = await callNextEntry(opdId);
    if (entry) {
      emit({ opdId, tokenNumber: (entry as any).tokenNumber, message: `Token ${(entry as any).tokenNumber} has been called` });
    }
    return entry as QueueEntry | undefined;
  },

  async callToken(tokenNumber: string): Promise<QueueEntry | undefined> {
    const { default: mongoose } = await import("mongoose");
    const { QueueEntryModel } = await import("@/lib/models");
    await (QueueEntryModel as any).findOneAndUpdate(
      { tokenNumber, status: "waiting" },
      { $set: { status: "called", updatedAt: new Date().toISOString() } }
    );
    const entry = await QueueEntryModel.findOne({ tokenNumber }).lean();
    if (entry) {
      emit({ opdId: (entry as any).opdId ?? "opd_001", tokenNumber, message: `Token ${tokenNumber} has been called` });
    }
    return entry as QueueEntry | undefined;
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
    return entry as QueueEntry | undefined;
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
    return entry as QueueEntry | undefined;
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
    return entry as QueueEntry | undefined;
  },
};
