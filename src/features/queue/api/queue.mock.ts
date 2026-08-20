import { opdService } from "@/services/opd";
import { queueService } from "@/services/queue";
import { getDepartment, getDoctor, getHospital, getOpdHospitalId } from "@/services/data";
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
    const [opd, token, entries] = await Promise.all([
      opdService.getById(opdId),
      queueService.getStatus(tokenId),
      queueService.list(opdId),
    ]);

    if (!opd || !token) {
      throw new Error("Queue information not found");
    }

    const nowServing =
      entries.find((e) => e.status === "in_consultation")?.tokenNumber ??
      entries.find((e) => e.status === "called")?.tokenNumber ??
      opd.currentlyServing;

    const startIndex = nowServing
      ? Math.max(0, entries.findIndex((e) => e.tokenNumber === nowServing))
      : 0;
    const visibleEntries = entries.slice(startIndex);

    const userIndex = entries.findIndex((e) => e.tokenNumber === token.tokenNumber);
    const patientsAhead =
      userIndex >= 0
        ? entries.filter((e, index) => index < userIndex && e.status === "waiting").length
        : token.patientsAhead;

    const department = opd.departmentId ? getDepartment(opd.departmentId) : undefined;
    const doctor = getDoctor();

    return {
      tokenNumber: token.tokenNumber,
      opdName: opd.name,
      departmentName: department?.name ?? null,
      doctorName: doctor.opdId === opdId ? doctor.name : null,
      room: opdId === "opd_001" ? "Room 04" : null,
      nowServing,
      patientsAhead,
      estimatedWaitMinutes:
        token.status === "waiting" ? estimateWaitMinutes(patientsAhead) : null,
      status: token.status,
      entries: visibleEntries,
      fetchedAt: new Date().toISOString(),
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

  async getDisplaySnapshot(opdId: string): Promise<DisplaySnapshot> {
    const [opd, entries, doctor] = await Promise.all([
      opdService.getById(opdId),
      queueService.list(opdId),
      Promise.resolve(getDoctor()),
    ]);

    if (!opd) {
      throw new Error("OPD not found");
    }

    const hospitalId = getOpdHospitalId(opdId);
    const hospital = hospitalId ? getHospital(hospitalId) : undefined;
    const department = opd.departmentId ? getDepartment(opd.departmentId) : undefined;
    const waiting = entries.filter((e) => e.status === "waiting");
    const nowServing =
      entries.find((e) => e.status === "in_consultation")?.tokenNumber ??
      entries.find((e) => e.status === "called")?.tokenNumber ??
      opd.currentlyServing;

    return {
      hospitalName: hospital?.name ?? "Government Hospital",
      departmentName: department?.name ?? null,
      opdName: opd.name,
      doctorName: doctor.opdId === opdId ? doctor.name : null,
      room: opdId === "opd_001" ? "Room 04" : null,
      nowServing,
      nextTokens: waiting.slice(0, 5).map((e) => e.tokenNumber),
      waitingCount: waiting.length,
    };
  },

  async callNext(opdId: string): Promise<QueueEntry | undefined> {
    const entry = await queueService.callNext(opdId);
    if (entry) {
      emit({ opdId, tokenNumber: entry.tokenNumber, message: `Token ${entry.tokenNumber} has been called` });
    }
    return entry;
  },

  async callToken(tokenNumber: string): Promise<QueueEntry | undefined> {
    const entry = await queueService.callToken(tokenNumber);
    if (entry) {
      emit({ opdId: "opd_001", tokenNumber, message: `Token ${tokenNumber} has been called` });
    }
    return entry;
  },

  async startConsultation(tokenNumber: string): Promise<QueueEntry | undefined> {
    const entry = await queueService.startConsultation(tokenNumber);
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
    const entry = await queueService.complete(tokenNumber);
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
    const entry = await queueService.skip(tokenNumber);
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
