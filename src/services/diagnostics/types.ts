export type DiagnosticCategory = "laboratory" | "imaging" | "other";

export type CatalogParameter = {
  key: string;
  name: string;
  unit?: string;
  refLow?: number;
  refHigh?: number;
  refText?: string;
  /** Backend-authoritative critical-value thresholds (§7). */
  criticalLow?: number;
  criticalHigh?: number;
  numeric: boolean;
};

export type SchedulingMode = "walk_in" | "slot";

export type TestCatalogItem = {
  id: string;
  name: string;
  category: DiagnosticCategory;
  specimenType: string;
  parameters: CatalogParameter[];
  /** Configurable per-service scheduling (§9): slot-based services book DiagnosticSlots, walk-in don't. */
  schedulingMode?: SchedulingMode;
  slotMinutes?: number;
  dailyCapacity?: number;
  note?: string;
};

/** Per-item workflow status using the Phase 24 lab/diagnostics vocabulary (§1). */
export type ItemWorkflowStatus =
  | "ordered"
  | "sample_pending"
  | "sample_collected"
  | "scheduled"
  | "processing"
  | "procedure_done"
  | "result_pending"
  | "awaiting_verification"
  | "verified"
  | "published"
  | "cancelled"
  | "rejected";

export type OrderItemWorkflow = {
  status: ItemWorkflowStatus;
  /** Human sample code, e.g. SMP-80042 (§3). Lab items only. */
  sampleId?: string;
  slotId?: string;
  scheduledAt?: string;
  performedAt?: string;
  updatedAt?: string;
};

const LEGACY_ITEM_STATUS_MAP: Record<string, ItemWorkflowStatus> = {
  ordered: "ordered",
  sample_collected: "sample_collected",
  processing: "processing",
  completed: "published",
  cancelled: "cancelled",
  rejected: "rejected",
};

export function normalizeItemStatus(status: string | undefined): ItemWorkflowStatus {
  if (!status) return "ordered";
  return LEGACY_ITEM_STATUS_MAP[status] ?? (status as ItemWorkflowStatus);
}

/** Rank used to derive the coarse order status as the earliest stage across its items. */
const STAGE_RANK: Partial<Record<ItemWorkflowStatus, number>> = {
  ordered: 1,
  sample_pending: 2,
  scheduled: 2,
  sample_collected: 3,
  processing: 4,
  procedure_done: 4,
  result_pending: 5,
  awaiting_verification: 6,
  verified: 7,
  published: 8,
  cancelled: 99,
  rejected: 99,
};

export type DiagnosticOrderItem = {
  testId: string;
  testName: string;
  category: DiagnosticCategory;
  priority: "routine" | "urgent";
  instructions?: string;
  workflow?: OrderItemWorkflow;
};

export type DiagnosticOrderStatus =
  | "draft"
  | "ordered"
  | "sample_pending"
  | "sample_collected"
  | "scheduled"
  | "processing"
  | "procedure_done"
  | "result_pending"
  | "awaiting_verification"
  | "verified"
  | "published"
  | "completed" // legacy alias of published
  | "cancelled"
  | "rejected";

/** Order status = the least-advanced non-terminal item workflow (keeps mixed lab+imaging orders coherent). */
export function deriveOrderStatus(items: { workflow?: OrderItemWorkflow }[]): DiagnosticOrderStatus {
  let min = Number.POSITIVE_INFINITY;
  for (const item of items) {
    const st = normalizeItemStatus(item.workflow?.status);
    const rank = STAGE_RANK[st] ?? 1;
    if (rank < min) min = rank;
  }
  if (!Number.isFinite(min)) return "ordered";
  const entry = (Object.entries(STAGE_RANK) as [ItemWorkflowStatus, number][]).find(([, r]) => r === min);
  const label = entry?.[0] ?? "ordered";
  if (label === "procedure_done") return "processing";
  return label as DiagnosticOrderStatus;
}

export type DiagnosticOrder = {
  id: string;
  patientId: string;
  encounterId: string;
  doctorId: string;
  doctorName: string;
  hospitalId: string;
  hospitalName: string;
  departmentName: string;
  createdAt: string;
  orderedAt?: string;
  completedAt?: string;
  items: DiagnosticOrderItem[];
  clinicalNotes?: string;
  priority: "routine" | "urgent";
  status: DiagnosticOrderStatus;
  specimenId?: string;
  cancelledReason?: string;
};

export type SlotAvailability = {
  slotId: string;
  startTime: string;
  endTime: string;
  bookedCount: number;
  capacity: number;
  status: "available" | "full" | "closed";
};

export type DiagnosticOrderContextRef = {
  patientId: string;
  doctorId: string;
  doctorName: string;
  hospitalId: string;
  hospitalName: string;
  departmentName: string;
};

export type SpecimenStatus =
  | "pending"
  | "collected"
  | "received"
  | "processing"
  | "rejected"
  | "completed";

export type Specimen = {
  id: string;
  orderId: string;
  patientId: string;
  type: string;
  status: SpecimenStatus;
  /** Human sample identifier, e.g. SMP-80042 — never identify samples by patient name alone (§3). */
  sampleId?: string;
  collectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
};

export type ResultFlag = "normal" | "low" | "high" | null;

export type ResultValue = {
  parameterKey: string;
  name: string;
  unit?: string;
  value: string;
  refText?: string;
  refLow?: number;
  refHigh?: number;
  flag: ResultFlag;
};

export type ResultStatus =
  | "draft"
  | "submitted_for_verification"
  | "verified"
  | "published"
  | "preliminary" // legacy alias of submitted_for_verification
  | "final" // legacy alias of verified
  | "amended"
  | "cancelled";

export function normalizeResultStatus(status: string | undefined): ResultStatus {
  switch (status) {
    case "preliminary":
      return "submitted_for_verification";
    case "final":
      return "verified";
    default:
      return (status as ResultStatus) ?? "draft";
  }
}

export type CriticalValueInfo = {
  parameters: { key: string; name: string; value: string }[];
  detectedAt: string;
  acknowledgedBy?: string;
  acknowledgedByName?: string;
  acknowledgedAt?: string;
  ackNote?: string;
};

export type DiagnosticResult = {
  id: string;
  orderId: string;
  testId: string;
  testName: string;
  category: DiagnosticCategory;
  patientId: string;
  status: ResultStatus;
  values: ResultValue[];
  notes?: string;
  /** Structured imaging report fields (§10) — kept separate from study metadata/images (§11). */
  findings?: string;
  impression?: string;
  reportedById?: string;
  reportedByName?: string;
  /** Backend-detected critical values with acknowledgement workflow (§7). */
  critical?: CriticalValueInfo;
  draftedAt?: string;
  submittedAt?: string;
  finalizedAt?: string;
  verifiedAt?: string;
  verifiedById?: string;
  verifiedByName?: string;
  publishedAt?: string;
  amendedFrom?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  cancelledReason?: string;
};

export type PatientTestEntry = {
  orderId: string;
  testId: string;
  testName: string;
  category: DiagnosticCategory;
  orderStatus: DiagnosticOrderStatus;
  resultStatus: ResultStatus | null;
  resultId: string | null;
  orderedAt: string;
  reportedAt: string | null;
};

export function computeResultFlag(
  value: string,
  param: CatalogParameter
): ResultFlag {
  if (!param.numeric) return null;
  const n = Number.parseFloat(value.replace(/[^0-9.\-]/g, ""));
  if (Number.isNaN(n)) return null;
  if (param.refLow !== undefined && n < param.refLow) return "low";
  if (param.refHigh !== undefined && n > param.refHigh) return "high";
  return "normal";
}

/** Backend-authoritative critical-value check (§7) — the UI never decides clinical criticality. */
export function computeCriticalFlag(value: string, param: CatalogParameter): boolean {
  if (!param.numeric || (param.criticalLow === undefined && param.criticalHigh === undefined)) return false;
  const n = Number.parseFloat(value.replace(/[^0-9.\-]/g, ""));
  if (Number.isNaN(n)) return false;
  if (param.criticalLow !== undefined && n < param.criticalLow) return true;
  if (param.criticalHigh !== undefined && n > param.criticalHigh) return true;
  return false;
}

/** Evaluate a result's values against catalog critical thresholds; returns offending parameters. */
export function evaluateCriticalValues(
  values: { parameterKey: string; value: string }[],
  params: CatalogParameter[]
): CriticalValueInfo["parameters"] {
  const out: CriticalValueInfo["parameters"] = [];
  for (const v of values) {
    const param = params.find((p) => p.key === v.parameterKey);
    if (!param) continue;
    if (computeCriticalFlag(v.value, param)) {
      out.push({ key: param.key, name: param.name, value: v.value });
    }
  }
  return out;
}