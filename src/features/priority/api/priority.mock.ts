import { listOpdsByHospital, listQueue } from "@/services/data";
import { queueService, orderWaiting } from "@/services/queue";
import { realtimeClient } from "@/features/realtime/client";
import type { PriorityLevel } from "../types/priority.types";
import type {
  AssistanceFilters,
  AssistanceRequest,
  AssistanceStatus,
  AssistanceType,
  AssessmentRow,
  OverrideFilters,
  OverrideStatus,
  PriorityAssessment,
  PriorityAuditEntry,
  QueueOverrideRequest,
} from "../types/priority.types";

const delay = () => new Promise((resolve) => setTimeout(resolve, 250));

const AUDIT_KEY = "sh.priority.audit";
const ASSESSMENT_KEY = "sh.priority.assessments";
const ASSISTANCE_KEY = "sh.priority.assistance";
const OVERRIDE_KEY = "sh.priority.overrides";

function read<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

function nextId(prefix: string, existing: string[]): string {
  return `${prefix}${Date.now()}_${existing.length + 1}`;
}

function seedAudit(): PriorityAuditEntry[] {
  return [];
}

const assessmentsStore: PriorityAssessment[] = read(ASSESSMENT_KEY, []);
const auditStore: PriorityAuditEntry[] = read(AUDIT_KEY, seedAudit());
const assistanceStore: AssistanceRequest[] = read(ASSISTANCE_KEY, []);
const overrideStore: QueueOverrideRequest[] = read(OVERRIDE_KEY, []);

function persistAssessment() {
  write(ASSESSMENT_KEY, assessmentsStore);
}
function persistAudit() {
  write(AUDIT_KEY, auditStore);
}
function persistAssistance() {
  write(ASSISTANCE_KEY, assistanceStore);
}
function persistOverrides() {
  write(OVERRIDE_KEY, overrideStore);
}

export const priorityMockApi = {
  async getAssessmentList(hospitalId: string): Promise<AssessmentRow[]> {
    await delay();
    const rows: AssessmentRow[] = [];
    for (const opd of listOpdsByHospital(hospitalId)) {
      const queue = listQueue(opd.id);
      const ordered = orderWaiting(queue.filter((q) => q.status === "waiting"));
      ordered.forEach((entry, index) => {
        const assessment = assessmentsStore.find(
          (a) => a.tokenNumber === entry.tokenNumber && a.opdId === opd.id
        );
        rows.push({
          opdId: opd.id,
          opdName: opd.name,
          tokenNumber: entry.tokenNumber,
          patientId: entry.patientId,
          patientName: entry.patientName,
          priority: entry.priority,
          position: index + 1,
          assessed: assessment !== undefined,
        });
      });
    }
    return rows;
  },

  async assignPriority(input: {
    opdId: string;
    tokenNumber: string;
    patientId: string | null;
    patientName: string | null;
    level: PriorityLevel;
    notes?: string;
    assessedById: string;
    assessedBy: string;
  }): Promise<PriorityAssessment | undefined> {
    await delay();
    const entry = await queueService.setPriority(input.tokenNumber, input.level);
    if (!entry) return undefined;

    const previous = assessmentsStore.find(
      (a) => a.tokenNumber === input.tokenNumber && a.opdId === input.opdId
    );
    const previousLevel = previous?.level ?? "normal";

    const assessment: PriorityAssessment = {
      id: nextId("pa_", assessmentsStore.map((a) => a.id)),
      opdId: input.opdId,
      tokenNumber: input.tokenNumber,
      patientId: input.patientId,
      patientName: input.patientName,
      level: input.level,
      assessedById: input.assessedById,
      assessedBy: input.assessedBy,
      assessedAt: new Date().toISOString(),
      notes: input.notes,
    };
    assessmentsStore.unshift(assessment);
    persistAssessment();

    auditStore.unshift({
      id: nextId("aud_", auditStore.map((a) => a.id)),
      opdId: input.opdId,
      tokenNumber: input.tokenNumber,
      patientName: input.patientName,
      action: "priority_changed",
      previous: previousLevel,
      current: input.level,
      byId: input.assessedById,
      by: input.assessedBy,
      at: assessment.assessedAt,
      note: input.notes,
    });
    persistAudit();

    realtimeClient.emit({
      type: "PRIORITY_CHANGED",
      opdId: input.opdId,
      tokenNumber: input.tokenNumber,
      level: input.level,
      at: assessment.assessedAt,
    });

    return assessment;
  },

  async listAssessments(): Promise<PriorityAssessment[]> {
    await delay();
    return [...assessmentsStore];
  },

  async listAudit(): Promise<PriorityAuditEntry[]> {
    await delay();
    return [...auditStore];
  },

  async listAssistance(filters: AssistanceFilters = {}): Promise<AssistanceRequest[]> {
    await delay();
    return [...assistanceStore]
      .filter((a) => !filters.status || a.status === filters.status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async requestAssistance(input: {
    patientId: string;
    patientName: string;
    type: AssistanceType;
  }): Promise<AssistanceRequest> {
    await delay();
    const request: AssistanceRequest = {
      id: nextId("as_", assistanceStore.map((a) => a.id)),
      patientId: input.patientId,
      patientName: input.patientName,
      type: input.type,
      status: "requested",
      createdAt: new Date().toISOString(),
    };
    assistanceStore.unshift(request);
    persistAssistance();
    return request;
  },

  async updateAssistanceStatus(
    id: string,
    status: AssistanceStatus,
    assignedTo?: string
  ): Promise<AssistanceRequest | undefined> {
    await delay();
    const request = assistanceStore.find((a) => a.id === id);
    if (!request) return undefined;
    request.status = status;
    if (assignedTo) request.assignedTo = assignedTo;
    persistAssistance();
    return { ...request };
  },

  async listOverrides(filters: OverrideFilters = {}): Promise<QueueOverrideRequest[]> {
    await delay();
    return [...overrideStore]
      .filter((o) => !filters.status || o.status === filters.status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async requestOverride(input: {
    opdId: string;
    tokenNumber: string;
    patientId: string | null;
    patientName: string | null;
    reason: string;
    requestedById: string;
    requestedBy: string;
  }): Promise<QueueOverrideRequest | undefined> {
    await delay();
    if (overrideStore.some((o) => o.tokenNumber === input.tokenNumber && o.status === "pending")) {
      throw new Error("A pending override already exists for this token.");
    }
    const request: QueueOverrideRequest = {
      id: nextId("ov_", overrideStore.map((o) => o.id)),
      opdId: input.opdId,
      tokenNumber: input.tokenNumber,
      patientId: input.patientId,
      patientName: input.patientName,
      requestedById: input.requestedById,
      requestedBy: input.requestedBy,
      reason: input.reason,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    overrideStore.unshift(request);
    persistOverrides();

    auditStore.unshift({
      id: nextId("aud_", auditStore.map((a) => a.id)),
      opdId: input.opdId,
      tokenNumber: input.tokenNumber,
      patientName: input.patientName,
      action: "override_requested",
      byId: input.requestedById,
      by: input.requestedBy,
      at: request.createdAt,
      note: input.reason,
    });
    persistAudit();

    return request;
  },

  async approveOverride(
    id: string,
    reviewedBy: string,
    reviewedById?: string
  ): Promise<QueueOverrideRequest | undefined> {
    await delay();
    const request = overrideStore.find((o) => o.id === id);
    if (!request || request.status !== "pending") return undefined;
    request.status = "approved";
    request.reviewedBy = reviewedBy;
    request.reviewedAt = new Date().toISOString();
    persistOverrides();

    await queueService.setOverrideAhead(request.tokenNumber, true);

    auditStore.unshift({
      id: nextId("aud_", auditStore.map((a) => a.id)),
      opdId: request.opdId,
      tokenNumber: request.tokenNumber,
      patientName: request.patientName,
      action: "override_approved",
      byId: reviewedById ?? "",
      by: reviewedBy,
      at: request.reviewedAt,
    });
    persistAudit();

    realtimeClient.emit({
      type: "QUEUE_UPDATED",
      opdId: request.opdId,
      at: request.reviewedAt,
    });

    return { ...request };
  },

  async rejectOverride(
    id: string,
    reviewedBy: string,
    note?: string,
    reviewedById?: string
  ): Promise<QueueOverrideRequest | undefined> {
    await delay();
    const request = overrideStore.find((o) => o.id === id);
    if (!request || request.status !== "pending") return undefined;
    request.status = "rejected";
    request.reviewedBy = reviewedBy;
    request.reviewedAt = new Date().toISOString();
    request.reviewNote = note;
    persistOverrides();

    auditStore.unshift({
      id: nextId("aud_", auditStore.map((a) => a.id)),
      opdId: request.opdId,
      tokenNumber: request.tokenNumber,
      patientName: request.patientName,
      action: "override_rejected",
      byId: reviewedById ?? "",
      by: reviewedBy,
      at: request.reviewedAt,
      note,
    });
    persistAudit();

    return { ...request };
  },
};

export type { OverrideStatus, AssistanceStatus };
