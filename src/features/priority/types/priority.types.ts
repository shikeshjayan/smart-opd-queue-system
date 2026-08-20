import type { QueuePriority } from "@/types";

export type { QueuePriority };

export type PriorityLevel = QueuePriority;

export type PriorityAssessment = {
  id: string;
  opdId: string;
  tokenNumber: string;
  patientId: string | null;
  patientName: string | null;
  level: PriorityLevel;
  assessedById: string;
  assessedBy: string;
  assessedAt: string;
  notes?: string;
};

export type AssistanceType = "mobility" | "communication" | "navigation" | "other";

export type AssistanceStatus = "requested" | "assigned" | "in_progress" | "completed" | "cancelled";

export type AssistanceRequest = {
  id: string;
  patientId: string;
  patientName: string;
  type: AssistanceType;
  status: AssistanceStatus;
  createdAt: string;
  assignedTo?: string;
};

export type OverrideStatus = "pending" | "approved" | "rejected" | "cancelled";

export type QueueOverrideRequest = {
  id: string;
  opdId: string;
  tokenNumber: string;
  patientId: string | null;
  patientName: string | null;
  requestedById: string;
  requestedBy: string;
  reason: string;
  status: OverrideStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
};

export type PriorityAuditAction =
  | "priority_changed"
  | "override_requested"
  | "override_approved"
  | "override_rejected";

export type PriorityAuditEntry = {
  id: string;
  opdId: string;
  tokenNumber: string;
  patientName: string | null;
  action: PriorityAuditAction;
  previous?: string;
  current?: string;
  byId: string;
  by: string;
  at: string;
  note?: string;
};

export type AssessmentRow = {
  opdId: string;
  opdName: string;
  tokenNumber: string;
  patientId: string | null;
  patientName: string | null;
  priority: PriorityLevel;
  position: number;
  assessed: boolean;
};

export type AssistanceFilters = {
  status?: AssistanceStatus;
};

export type OverrideFilters = {
  status?: OverrideStatus;
};
