"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import {
  DiagnosticOrderModel,
  DiagnosticResultModel,
  DiagnosticAuditModel,
  DiagnosticSlotModel,
  PatientModel,
  NotificationModel,
  CounterModel,
} from "@/lib/models";
import { getSession } from "@/lib/auth";
import { roleHasPermission } from "@/features/auth/permissions";
import { notify } from "@/server/notifications/service";
import type { SessionUser } from "@/features/auth/types/auth.types";
import { testCatalogue, testById } from "@/services/diagnostics/catalog";
import {
  computeResultFlag,
  computeCriticalFlag,
  evaluateCriticalValues,
  deriveOrderStatus,
  normalizeItemStatus,
  normalizeResultStatus,
} from "@/services/diagnostics/types";
import type {
  CatalogParameter,
  DiagnosticCategory,
  DiagnosticOrder,
  DiagnosticOrderItem,
  DiagnosticOrderStatus,
  DiagnosticResult,
  ItemWorkflowStatus,
  PatientTestEntry,
  ResultValue,
  Specimen,
  TestCatalogItem,
} from "@/services/diagnostics/types";

/* ---------- helpers ---------- */

type OrderDoc = Record<string, unknown> & { _id?: string };

async function requirePermission(permission: Parameters<typeof roleHasPermission>[1]): Promise<SessionUser> {
  const session = await getSession();
  if (!session || !roleHasPermission(session.role, permission)) {
    throw new Error(`FORBIDDEN: missing permission ${permission}`);
  }
  return session;
}

async function actor(): Promise<SessionUser | null> {
  return getSession();
}

const LEGACY_ORDER_STATUS_MAP: Record<string, DiagnosticOrderStatus> = {
  draft: "draft",
  ordered: "ordered",
  sample_pending: "sample_pending",
  sample_collected: "sample_collected",
  scheduled: "scheduled",
  processing: "processing",
  procedure_done: "procedure_done",
  result_pending: "result_pending",
  awaiting_verification: "awaiting_verification",
  verified: "verified",
  published: "published",
  completed: "published",
  cancelled: "cancelled",
  rejected: "rejected",
};

function orderItemsOf(d: any): DiagnosticOrderItem[] {
  const raw: any[] = d.items ?? d.tests ?? [];
  return raw.map((it) => ({
    ...it,
    workflow: it.workflow
      ? { ...it.workflow, status: normalizeItemStatus(it.workflow.status) }
      : undefined,
  }));
}

/** Status precedence: derive from per-item workflows when present, else map legacy coarse status. */
function resolveOrderStatus(d: any): DiagnosticOrderStatus {
  const items = orderItemsOf(d);
  const hasWorkflow = items.some((i) => i.workflow?.status);
  if (hasWorkflow) return deriveOrderStatus(items);
  return LEGACY_ORDER_STATUS_MAP[d.status] ?? "ordered";
}

export function normalizeOrder(doc: OrderDoc | null): DiagnosticOrder | null {
  if (!doc) return null;
  const d = doc as any;
  return {
    id: String(d.orderId ?? d._id),
    patientId: d.patientId ?? "",
    encounterId: d.encounterId ?? "",
    doctorId: d.doctorId ?? "",
    doctorName: d.doctorName ?? "",
    hospitalId: d.hospitalId ?? "",
    hospitalName: d.hospitalName ?? "",
    departmentName: d.departmentName ?? "",
    createdAt: d.createdAt ?? d.orderedAt ?? d.updatedAt ?? new Date().toISOString(),
    orderedAt: d.orderedAt,
    completedAt: d.completedAt,
    priority: d.priority === "urgent" ? "urgent" : "routine",
    items: orderItemsOf(d),
    clinicalNotes: d.clinicalNotes ?? d.instructions,
    status: resolveOrderStatus(d),
    specimenId: d.specimenId,
    cancelledReason: d.cancelledReason,
  };
}

export function normalizeResult(doc: OrderDoc | null): DiagnosticResult | null {
  if (!doc) return null;
  const d = doc as any;
  return {
    id: String(d._id),
    orderId: d.orderId ?? "",
    testId: d.testId ?? "",
    testName: d.testName ?? "",
    category: d.category ?? "laboratory",
    patientId: d.patientId ?? "",
    status: normalizeResultStatus(d.status),
    values: (d.values ?? []) as ResultValue[],
    notes: d.notes,
    findings: d.findings,
    impression: d.impression,
    reportedById: d.reportedById,
    reportedByName: d.reportedByName,
    critical: d.critical ?? undefined,
    draftedAt: d.draftedAt ?? d.createdAt,
    submittedAt: d.submittedAt,
    finalizedAt: d.finalizedAt,
    verifiedAt: d.verifiedAt ?? (d.status === "final" ? d.finalizedAt : undefined),
    verifiedById: d.verifiedById,
    verifiedByName: d.verifiedByName,
    publishedAt: d.publishedAt,
    amendedFrom: d.amendedFrom,
    reviewedAt: d.reviewedAt,
    reviewedBy: d.reviewedBy,
    cancelledReason: d.cancelledReason,
  };
}

function normalizeSpecimen(doc: OrderDoc | null): Specimen | null {
  if (!doc) return null;
  const d = doc as any;
  return {
    id: String(d.id ?? d._id),
    orderId: d.orderId ?? "",
    patientId: d.patientId ?? "",
    type: d.type ?? "",
    status: d.status ?? "pending",
    sampleId: d.sampleId,
    collectedAt: d.collectedAt,
    rejectionReason: d.rejectionReason,
    createdAt: d.createdAt ?? new Date().toISOString(),
  };
}

async function audit(orderId: string, action: string, detail: Record<string, unknown> = {}) {
  const session = await getSession();
  await DiagnosticAuditModel.create({
    orderId,
    action,
    actorId: session?.id,
    detail,
    createdAt: new Date().toISOString(),
  });
}

async function resultAudit(
  resultId: string,
  orderId: string,
  action: string,
  detail?: Record<string, unknown>
) {
  const session = await getSession();
  await DiagnosticAuditModel.create({
    resultId,
    orderId,
    action,
    actorId: session?.id,
    detail,
    createdAt: new Date().toISOString(),
  });
}

async function patientName(patientId: string): Promise<string> {
  const p = await PatientModel.findOne({ _id: patientId }).lean<{ name?: string } | null>();
  return (p as any)?.name ?? "Patient";
}

async function findOrder(orderId: string) {
  return DiagnosticOrderModel.findOne({
    $or: [{ _id: orderId }, { orderId }],
  }).lean<any>();
}

/** Recompute the coarse order status from per-item workflows and persist it. */
async function syncOrderStatus(docId: string) {
  const fresh = await DiagnosticOrderModel.findById(docId).lean<any>();
  if (!fresh) return;
  const items = orderItemsOf(fresh);
  const status = deriveOrderStatus(items);
  const allPublished =
    items.length > 0 && items.every((i) => ["published", "cancelled"].includes(normalizeItemStatus(i.workflow?.status)));
  await DiagnosticOrderModel.updateOne(
    { _id: docId },
    {
      $set: {
        status,
        updatedAt: new Date().toISOString(),
        ...(allPublished ? { completedAt: new Date().toISOString() } : {}),
      },
    }
  );
}

/** Advance one order item's workflow with a precondition on its current status. */
async function advanceItem(
  docId: string,
  testId: string,
  from: ItemWorkflowStatus[],
  patch: Partial<DiagnosticOrderItem["workflow"]> & { status: ItemWorkflowStatus }
): Promise<boolean> {
  const fresh = await DiagnosticOrderModel.findById(docId).lean<any>();
  if (!fresh) return false;
  const items: any[] = orderItemsOf(fresh);
  const idx = items.findIndex((i) => i.testId === testId);
  if (idx === -1) return false;
  const current = normalizeItemStatus(items[idx].workflow?.status);
  if (!from.includes(current)) return false;
  items[idx].workflow = {
    ...(items[idx].workflow ?? {}),
    ...patch,
    status: patch.status,
    updatedAt: new Date().toISOString(),
  };
  await DiagnosticOrderModel.updateOne({ _id: docId }, { $set: { items, updatedAt: new Date().toISOString() } });
  return true;
}

/* ---------- catalog ---------- */

export async function searchTests(query: string, category?: DiagnosticCategory): Promise<TestCatalogItem[]> {
  const q = query.trim().toLowerCase();
  return testCatalogue.filter(
    (t) =>
      (!category || t.category === category) &&
      (!q || t.name.toLowerCase().includes(q))
  );
}

export async function listTests(): Promise<TestCatalogItem[]> {
  return [...testCatalogue];
}

/* ---------- orders ---------- */

export async function listDiagnosticsForEncounter(encounterId: string): Promise<DiagnosticOrder[]> {
  await dbConnect();
  const docs = await DiagnosticOrderModel.find({ encounterId }).lean<OrderDoc[]>();
  return (docs as any[]).map((d) => normalizeOrder(d)!).filter(Boolean);
}

export async function listForPatient(patientId: string): Promise<DiagnosticOrder[]> {
  await dbConnect();
  const docs = await DiagnosticOrderModel.find({ patientId })
    .sort({ orderedAt: -1, createdAt: -1 })
    .lean<OrderDoc[]>();
  return (docs as any[]).map((d) => normalizeOrder(d)!).filter(Boolean);
}

export async function listAll(): Promise<DiagnosticOrder[]> {
  await dbConnect();
  const docs = await DiagnosticOrderModel.find({})
    .sort({ orderedAt: -1, createdAt: -1 })
    .limit(200)
    .lean<OrderDoc[]>();
  return (docs as any[]).map((d) => normalizeOrder(d)!).filter(Boolean);
}

export async function getOrder(orderId: string): Promise<DiagnosticOrder | undefined> {
  await dbConnect();
  return normalizeOrder(await findOrder(orderId)) ?? undefined;
}

/** Workspace queue: laboratory kind returns orders having lab items; imaging kind the rest. */
export async function listWorkspaceOrders(
  kind: "laboratory" | "imaging"
): Promise<DiagnosticOrder[]> {
  await dbConnect();
  const wanted: DiagnosticCategory[] = kind === "laboratory" ? ["laboratory"] : ["imaging", "other"];
  const docs = await DiagnosticOrderModel.find({
    status: { $nin: ["draft", "cancelled"] },
  })
    .sort({ orderedAt: -1, createdAt: -1 })
    .limit(300)
    .lean<OrderDoc[]>();
  return (docs as any[])
    .map((d) => normalizeOrder(d)!)
    .filter((o) => o && o.items.some((i) => wanted.includes(i.category)));
}

export type LabStageCounts = {
  pending: number; // ordered / sample_pending / scheduled
  samplesCollected: number;
  processing: number;
  resultPending: number;
  awaitingVerification: number;
  verified: number;
  publishedToday: number;
  criticalUnacked: number;
};

function isToday(iso?: string): boolean {
  if (!iso) return false;
  return iso.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

export async function getLabDashboardStats(): Promise<LabStageCounts> {
  await dbConnect();
  const orders = await listWorkspaceOrders("laboratory");
  const counts: LabStageCounts = {
    pending: 0,
    samplesCollected: 0,
    processing: 0,
    resultPending: 0,
    awaitingVerification: 0,
    verified: 0,
    publishedToday: 0,
    criticalUnacked: 0,
  };
  const orderIds = new Set<string>();
  for (const order of orders) {
    for (const item of order.items) {
      if (item.category !== "laboratory") continue;
      orderIds.add(order.id);
      switch (normalizeItemStatus(item.workflow?.status)) {
        case "ordered":
        case "sample_pending":
          counts.pending += 1;
          break;
        case "sample_collected":
          counts.samplesCollected += 1;
          break;
        case "processing":
          counts.processing += 1;
          break;
        case "result_pending":
          counts.resultPending += 1;
          break;
        case "awaiting_verification":
          counts.awaitingVerification += 1;
          break;
        case "verified":
          counts.verified += 1;
          break;
        case "published":
          if (isToday(item.workflow?.updatedAt)) counts.publishedToday += 1;
          break;
      }
    }
  }
  const results = await DiagnosticResultModel.find({
    orderId: { $in: [...orderIds] },
    "critical.parameters.0": { $exists: true },
  }).lean<any[]>();
  for (const r of results) {
    if (!r.critical?.acknowledgedBy && r.status !== "cancelled") counts.criticalUnacked += 1;
  }
  return counts;
}

export async function createDraft(
  encounterId: string,
  ref: { patientId: string; doctorId: string; doctorName: string; hospitalId: string; hospitalName: string; departmentName: string },
  items: DiagnosticOrderItem[],
  clinicalNotes?: string
): Promise<DiagnosticOrder> {
  await dbConnect();
  const now = new Date().toISOString();
  const seq = await CounterModel.findByIdAndUpdate(
    "diag_order",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean<{ seq: number } | null>();
  const orderId = `LAB-${50000 + (seq?.seq ?? 1)}`;
  const doc = await DiagnosticOrderModel.create({
    _id: `LAB${Date.now()}`,
    orderId,
    encounterId,
    ...ref,
    patientName: await patientName(ref.patientId),
    items,
    clinicalNotes,
    status: "draft",
    specimens: [],
    createdAt: now,
    updatedAt: now,
  });
  await audit(String(doc._id), "order_draft_created");
  return normalizeOrder(doc.toObject())!;
}

export async function updateDraft(
  orderId: string,
  items: DiagnosticOrderItem[],
  clinicalNotes?: string
): Promise<DiagnosticOrder | undefined> {
  await dbConnect();
  const now = new Date().toISOString();
  const doc = await DiagnosticOrderModel.findOneAndUpdate(
    { $or: [{ _id: orderId }, { orderId }], status: "draft" },
    { $set: { items, clinicalNotes, updatedAt: now } },
    { new: true }
  ).lean<OrderDoc | null>();
  if (doc) await audit(String((doc as any)._id), "order_draft_updated");
  return normalizeOrder(doc) ?? undefined;
}

export async function submitOrder(orderId: string): Promise<DiagnosticOrder | undefined> {
  await dbConnect();
  const user = await requirePermission("ORDER_DIAGNOSTICS");
  const now = new Date().toISOString();
  const existing = await findOrder(orderId);
  if (!existing || existing.status !== "draft") return undefined;

  const items: DiagnosticOrderItem[] = orderItemsOf(existing).map((it) => {
    const test = testById(it.testId);
    const initial: ItemWorkflowStatus =
      test?.category === "laboratory" ? "sample_pending" : "ordered";
    return {
      ...it,
      workflow: { status: initial, updatedAt: now },
    };
  });

  const doc = await DiagnosticOrderModel.findOneAndUpdate(
    { _id: existing._id, status: "draft" },
    {
      $set: {
        items,
        status: "ordered",
        orderedAt: now,
        updatedBy: user.id,
        updatedAt: now,
      },
    },
    { new: true }
  ).lean<OrderDoc | null>();
  if (doc) await audit(String((doc as any)._id), "order_submitted");
  return normalizeOrder(doc) ?? undefined;
}

export async function cancelOrder(orderId: string, reason?: string): Promise<DiagnosticOrder | undefined> {
  await dbConnect();
  const now = new Date().toISOString();
  const doc = await DiagnosticOrderModel.findOneAndUpdate(
    {
      $or: [{ _id: orderId }, { orderId }],
      status: { $nin: ["published", "completed", "cancelled", "rejected"] },
    },
    { $set: { status: "cancelled", cancelledReason: reason, updatedAt: now } },
    { new: true }
  ).lean<OrderDoc | null>();
  if (doc) await audit(String((doc as any)._id), "order_cancelled", { reason });
  return normalizeOrder(doc) ?? undefined;
}

/* ---------- specimens & samples (§3/§4) ---------- */

export async function getSpecimenForOrder(orderId: string): Promise<Specimen | undefined> {
  await dbConnect();
  const doc = await findOrder(orderId);
  const raw = (doc as any)?.specimens?.[0];
  return normalizeSpecimen(raw ? { ...raw, orderId: String(raw.orderId ?? (doc as any).orderId ?? (doc as any)._id) } : null) ?? undefined;
}

/** Sample IDs come from an atomic counter — never identify a sample by patient name alone. */
export async function nextSampleId(): Promise<string> {
  const seq = await CounterModel.findByIdAndUpdate(
    "lab_sample",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean<{ seq: number } | null>();
  return `SMP-${80000 + (seq?.seq ?? 1)}`;
}

export async function collectSpecimen(
  orderId: string,
  type: string,
  confirmedPatientId?: string
): Promise<Specimen | undefined> {
  await dbConnect();
  await requirePermission("COLLECT_SAMPLES");
  const now = new Date().toISOString();
  const session = await actor();

  const order = await findOrder(orderId);
  if (!order) return undefined;
  // §3: verify patient identity before collection
  if (confirmedPatientId !== undefined && confirmedPatientId !== String(order.patientId)) {
    throw new Error("PATIENT_MISMATCH: confirmed patient does not match the order");
  }

  const sampleId = await nextSampleId();
  const existing = (order.specimens ?? [])[0];
  const specimen: any = existing ?? {
    id: `SP${Date.now()}`,
    orderId: String(order.orderId ?? order._id),
    patientId: String(order.patientId ?? ""),
    type,
    status: "collected",
    createdAt: now,
  };
  specimen.sampleId = sampleId;
  specimen.type = type || specimen.type;
  specimen.status = "collected";
  specimen.collectedAt = now;
  specimen.collectedBy = session?.id;

  // advance every lab item that is still waiting for a sample
  const items: DiagnosticOrderItem[] = orderItemsOf(order).map((it) => {
    if (it.category !== "laboratory") return it;
    const st = normalizeItemStatus(it.workflow?.status);
    if (st !== "sample_pending" && st !== "ordered") return it;
    return {
      ...it,
      workflow: { ...(it.workflow ?? {}), status: "sample_collected", sampleId, updatedAt: now },
    };
  });

  await DiagnosticOrderModel.updateOne(
    { _id: order._id },
    { $set: { specimens: [specimen], items, updatedAt: now } }
  );
  await syncOrderStatus(String(order._id));
  await audit(String(order._id), "SAMPLE_COLLECTED", { type, sampleId });
  return normalizeSpecimen(specimen)!;
}

export async function rejectSpecimen(orderId: string, reason: string): Promise<Specimen | undefined> {
  await dbConnect();
  await requirePermission("COLLECT_SAMPLES");
  const now = new Date().toISOString();
  const order = await findOrder(orderId);
  if (!order) return undefined;

  const specimens = order.specimens ?? [];
  if (!specimens.length) return undefined;
  specimens[0] = { ...specimens[0], status: "rejected", rejectionReason: reason };

  const items: DiagnosticOrderItem[] = orderItemsOf(order).map((it) =>
    it.category === "laboratory"
      ? { ...it, workflow: { ...(it.workflow ?? {}), status: "rejected" as ItemWorkflowStatus, updatedAt: now } }
      : it
  );

  await DiagnosticOrderModel.updateOne(
    { _id: order._id },
    { $set: { specimens, items, status: "rejected", updatedAt: now } }
  );
  await audit(String(order._id), "specimen_rejected", { reason });
  return normalizeSpecimen(specimens[0])!;
}

export async function startProcessing(orderId: string): Promise<Specimen | undefined> {
  await dbConnect();
  await requirePermission("ENTER_RESULTS");
  const now = new Date().toISOString();
  const order = await findOrder(orderId);
  if (!order) return undefined;

  const specimens = order.specimens ?? [];
  if (specimens.length) specimens[0] = { ...specimens[0], status: "processing" };

  const items: DiagnosticOrderItem[] = orderItemsOf(order).map((it) => {
    if (it.category !== "laboratory") return it;
    const st = normalizeItemStatus(it.workflow?.status);
    if (st !== "sample_collected") return it;
    return { ...it, workflow: { ...(it.workflow ?? {}), status: "processing", updatedAt: now } };
  });

  await DiagnosticOrderModel.updateOne(
    { _id: order._id },
    { $set: { specimens, items, updatedAt: now } }
  );
  await syncOrderStatus(String(order._id));
  await audit(String(order._id), "processing_started");
  return specimens.length ? normalizeSpecimen(specimens[0])! : undefined;
}

/* ---------- scheduling (§9) ---------- */

export async function listDiagnosticServices(): Promise<TestCatalogItem[]> {
  return testCatalogue.filter((t) => t.category !== "laboratory");
}

export type SlotAvailability = {
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  available: boolean;
};

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Lazily materialize a day's slots for a slot-scheduled service, then return availability. */
export async function getServiceSlots(
  testId: string,
  hospitalId: string,
  date: string
): Promise<SlotAvailability[]> {
  await dbConnect();
  const test = testById(testId);
  if (!test || test.schedulingMode !== "slot") return [];

  let created = false;
  try {
    const dayStart = 9 * 60;
    const lunchStart = 13 * 60;
    const afternoonStart = 14 * 60;
    const dayEnd = 17 * 60;
    const step = test.slotMinutes ?? 20;
    const docs: any[] = [];
    for (let m = dayStart; m + step <= dayEnd; m += step) {
      if (m + step > lunchStart && m < afternoonStart) continue; // lunch break
      docs.push({
        _id: `${testId}:${hospitalId}:${date}:${minutesToTime(m)}`,
        slotId: `DSL-${testId}-${date}-${minutesToTime(m).replace(":", "")}`,
        testId,
        hospitalId,
        date,
        startTime: minutesToTime(m),
        endTime: minutesToTime(m + step),
        durationMinutes: step,
        capacity: 1,
        bookedCount: 0,
        status: "available",
      });
    }
    if (docs.length) {
      const res = await DiagnosticSlotModel.insertMany(docs, { ordered: false });
      created = res.length > 0;
    }
  } catch {
    // unique-index duplicates mean slots already exist — safe to ignore
  }

  const slots = await DiagnosticSlotModel.find({ testId, hospitalId, date })
    .sort({ startTime: 1 })
    .lean<any[]>();
  if (created) void created;
  return slots.map((s) => ({
    slotId: s.slotId ?? String(s._id),
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    capacity: s.capacity,
    bookedCount: s.bookedCount,
    available: s.status === "available" && s.bookedCount < s.capacity,
  }));
}

export async function scheduleStudy(
  orderId: string,
  testId: string,
  slotId: string
): Promise<DiagnosticOrder | undefined> {
  await dbConnect();
  await requirePermission("SCHEDULE_DIAGNOSTICS");
  const now = new Date().toISOString();

  // Atomic booking: only succeeds while capacity remains.
  const slot = await DiagnosticSlotModel.findOneAndUpdate(
    { $or: [{ slotId }, { _id: slotId }], status: "available", bookedCount: { $lt: "$$capacity" } },
    { $inc: { bookedCount: 1 } },
    { new: true }
  ).lean<any>();

  // Mongo cannot reference another field in the filter — enforce capacity explicitly.
  let booked = slot;
  if (!booked) {
    booked = await DiagnosticSlotModel.findOneAndUpdate(
      { $or: [{ slotId }, { _id: slotId }], status: "available", bookedCount: { $lt: 999999 } },
      { $inc: { bookedCount: 1 } },
      { new: true }
    ).lean<any>();
    if (booked && booked.bookedCount > booked.capacity) {
      await DiagnosticSlotModel.updateOne({ _id: booked._id }, { $inc: { bookedCount: -1 } });
      throw new Error("SLOT_FULL: selected diagnostic slot is no longer available");
    }
  }
  if (!booked) throw new Error("SLOT_UNAVAILABLE");

  const order = await findOrder(orderId);
  if (!order) return undefined;

  await advanceItem(String(order._id), testId, ["ordered", "sample_pending", "scheduled"], {
    status: "scheduled",
    slotId: booked.slotId ?? String(booked._id),
    scheduledAt: `${booked.date}T${booked.startTime}:00`,
  });
  await syncOrderStatus(String(order._id));
  await audit(String(order._id), "study_scheduled", { testId, slotId: booked.slotId });
  return getOrder(String(order.orderId ?? order._id));
}

export async function markProcedureDone(
  orderId: string,
  testId: string
): Promise<DiagnosticOrder | undefined> {
  await dbConnect();
  await requirePermission("PERFORM_DIAGNOSTIC_PROCEDURE");
  const now = new Date().toISOString();
  const order = await findOrder(orderId);
  if (!order) return undefined;
  const ok = await advanceItem(String(order._id), testId, ["scheduled", "ordered"], {
    status: "procedure_done",
    performedAt: now,
  });
  if (!ok) throw new Error("INVALID_STATE: study is not scheduled/pending");
  await syncOrderStatus(String(order._id));
  await audit(String(order._id), "procedure_performed", { testId });
  return getOrder(String(order.orderId ?? order._id));
}

/* ---------- results ---------- */

export async function listResultsForOrder(orderId: string): Promise<DiagnosticResult[]> {
  await dbConnect();
  const docs = await DiagnosticResultModel.find({ orderId }).sort({ createdAt: 1 }).lean();
  return (docs as any[]).map((d) => normalizeResult(d)!).filter(Boolean);
}

export async function getResult(resultId: string): Promise<DiagnosticResult | undefined> {
  await dbConnect();
  const doc = await DiagnosticResultModel.findOne({ _id: resultId }).lean();
  return normalizeResult(doc) ?? undefined;
}

function enrichValues(values: ResultValue[], test?: TestCatalogItem): ResultValue[] {
  return values.map((v) => {
    const param: CatalogParameter | undefined = test?.parameters.find((p) => p.key === v.parameterKey);
    if (!param) return v;
    return { ...v, flag: v.flag ?? computeResultFlag(v.value, param) };
  });
}

/**
 * Save a result draft (lab values or imaging report text).
 * Criticality is computed HERE on the server against catalog rules — never client-side (§7).
 */
export async function saveResultDraft(
  orderId: string,
  testId: string,
  values: ResultValue[],
  notesOrReport?: string,
  report?: { findings?: string; impression?: string }
): Promise<DiagnosticResult | undefined> {
  await dbConnect();
  await requirePermission("ENTER_RESULTS");
  const now = new Date().toISOString();
  const session = await actor();
  const test = testById(testId);
  const enriched = enrichValues(values, test);

  const criticalParams = evaluateCriticalValues(enriched, test?.parameters ?? []);

  const existing = await DiagnosticResultModel.findOne({ orderId, testId, status: "draft" }).lean<any>();
  const baseUpdate: Record<string, unknown> = {
    values: enriched,
    notes: notesOrReport,
    updatedAt: now,
    critical: criticalParams.length
      ? {
          parameters: criticalParams,
          detectedAt: existing?.critical?.detectedAt ?? now,
          acknowledgedBy: existing?.critical?.acknowledgedBy,
          acknowledgedAt: existing?.critical?.acknowledgedAt,
          ackNote: existing?.critical?.ackNote,
        }
      : null,
    ...(report ? { findings: report.findings, impression: report.impression } : {}),
  };

  let doc: any;
  if (existing) {
    doc = await DiagnosticResultModel.findOneAndUpdate(
      { _id: existing._id, status: "draft" },
      { $set: baseUpdate },
      { new: true }
    ).lean();
  } else {
    const order = await findOrder(orderId);
    doc = await DiagnosticResultModel.create({
      _id: `RS${Date.now()}${Math.floor(Math.random() * 90 + 10)}`,
      orderId,
      testId,
      testName: test?.name ?? testId,
      category: test?.category ?? "laboratory",
      patientId: String(order?.patientId ?? ""),
      status: "draft",
      reportedById: test?.category === "laboratory" ? undefined : session?.id,
      reportedByName: test?.category === "laboratory" ? undefined : session?.name,
      ...baseUpdate,
      draftedAt: now,
      createdAt: now,
    });
  }

  const order = await findOrder(orderId);
  if (order) {
    const current = normalizeItemStatus(
      orderItemsOf(order).find((i) => i.testId === testId)?.workflow?.status
    );
    if (["sample_collected", "processing", "procedure_done", "ordered", "scheduled", "sample_pending"].includes(current)) {
      await advanceItem(String(order._id), testId, [
        "sample_collected",
        "processing",
        "procedure_done",
        "ordered",
        "scheduled",
        "sample_pending",
      ], { status: "result_pending" });
      await syncOrderStatus(String(order._id));
    }
  }

  await resultAudit(String(doc._id), orderId, "RESULT_DRAFT_SAVED", {
    testId,
    critical: criticalParams.length > 0,
  });
  return normalizeResult(doc) ?? undefined;
}

/** Technician submission: draft -> awaiting verification (§5/§6). */
export async function submitForVerification(resultId: string): Promise<DiagnosticResult | null> {
  await dbConnect();
  await requirePermission("SUBMIT_RESULTS");
  const now = new Date().toISOString();
  const doc = await DiagnosticResultModel.findOneAndUpdate(
    { _id: resultId, status: "draft" },
    { $set: { status: "submitted_for_verification", submittedAt: now, updatedAt: now } },
    { new: true }
  ).lean<any>();
  if (!doc) return null;

  await advanceItemByResult(doc, "awaiting_verification", now);
  await resultAudit(resultId, doc.orderId, "LAB_RESULT_SUBMITTED");
  return normalizeResult(doc);
}

async function advanceItemByResult(doc: any, status: ItemWorkflowStatus, now: string) {
  const order = await findOrder(doc.orderId);
  if (!order) return;
  const st = normalizeItemStatus(
    orderItemsOf(order).find((i) => i.testId === doc.testId)?.workflow?.status
  );
  if (st === status || st === "published" || st === "cancelled") return;
  await advanceItem(String(order._id), doc.testId, [st], { status });
  await syncOrderStatus(String(order._id));
}

/** Reviewer verification: submitted -> verified. Lab staff cannot reach past this without the role. */
export async function verifyResult(resultId: string): Promise<DiagnosticResult | null> {
  await dbConnect();
  const user = await requirePermission("VERIFY_RESULTS");
  const now = new Date().toISOString();
  const doc = await DiagnosticResultModel.findOneAndUpdate(
    { _id: resultId, status: { $in: ["submitted_for_verification", "preliminary", "draft"] } },
    {
      $set: {
        status: "verified",
        verifiedAt: now,
        verifiedById: user.id,
        verifiedByName: user.name,
        finalizedAt: now,
        updatedAt: now,
      },
    },
    { new: true }
  ).lean<any>();
  if (!doc) return null;

  await advanceItemByResult(doc, "verified", now);
  await resultAudit(resultId, doc.orderId, "LAB_RESULT_VERIFIED", { by: user.id });
  if (doc.critical?.parameters?.length && !doc.critical.acknowledgedBy) {
    await notifyCritical(doc);
  }
  return normalizeResult(doc);
}

async function notifyCritical(doc: any) {
  const order = await findOrder(doc.orderId);
  const pname = order?.patientName ?? (await patientName(String(doc.patientId ?? "")));
  await NotificationModel.create({
    hospitalId: order?.hospitalId,
    userId: order?.doctorId,
    audience: "hospital",
    type: "critical_result",
    category: "lab",
    title: `⚠ Critical result — ${doc.testName}`,
    message: `Critical value(s) detected for ${pname} (${doc.orderId}). Acknowledgement required.`,
    priority: "critical",
    read: false,
    createdAt: new Date().toISOString(),
  });
}

/** Publishing makes the result part of the patient medical record (§25).
 *  Unacknowledged critical results are withheld from publication (§7). */
export async function publishResult(resultId: string): Promise<DiagnosticResult | null> {
  await dbConnect();
  await requirePermission("VERIFY_RESULTS");
  const now = new Date().toISOString();
  const existing = await DiagnosticResultModel.findOne({ _id: resultId }).lean<any>();
  if (!existing) return null;
  if (existing.critical?.parameters?.length && !existing.critical.acknowledgedBy) {
    throw new Error("CRITICAL_NOT_ACKNOWLEDGED: acknowledge the critical result before publishing");
  }
  const doc = await DiagnosticResultModel.findOneAndUpdate(
    { _id: resultId, status: { $in: ["verified", "final", "amended"] } },
    { $set: { status: "published", publishedAt: now, updatedAt: now } },
    { new: true }
  ).lean<any>();
  if (!doc) return null;

  await advanceItemByResult(doc, "published", now);
  await resultAudit(resultId, doc.orderId, "RESULT_PUBLISHED");
  // §7: notify patient that result is available
  if (doc.patientId) {
    const orderId = doc.orderId;
    const category = (doc.category as string) ?? "laboratory";
    await notify({
      userId: doc.patientId,
      templateKey: category === "laboratory" ? "LAB_RESULT_AVAILABLE" : "DIAGNOSTIC_REPORT_AVAILABLE",
      params: { orderId },
      idempotencyKey: `result:${resultId}:published`,
      hospitalId: (doc as any).hospitalId,
      audience: "patient",
      resourceType: "diagnosticResult",
      resourceId: resultId,
    });
  }
  return normalizeResult(doc);
}

/** Authorized clinician acknowledges a critical result (§7): notification -> acknowledgement -> audit. */
export async function acknowledgeCriticalResult(
  resultId: string,
  note?: string
): Promise<DiagnosticResult | null> {
  await dbConnect();
  const user = await requirePermission("ACKNOWLEDGE_CRITICAL_RESULT");
  const now = new Date().toISOString();
  const doc = await DiagnosticResultModel.findOneAndUpdate(
    { _id: resultId, "critical.parameters.0": { $exists: true }, "critical.acknowledgedBy": { $exists: false } },
    {
      $set: {
        "critical.acknowledgedBy": user.id,
        "critical.acknowledgedByName": user.name,
        "critical.acknowledgedAt": now,
        "critical.ackNote": note,
        updatedAt: now,
      },
    },
    { new: true }
  ).lean<any>();
  if (!doc) return null;
  await resultAudit(resultId, doc.orderId, "CRITICAL_RESULT_ACKNOWLEDGED", {
    by: user.id,
    note,
  });
  return normalizeResult(doc);
}

/** Legacy entry point kept for existing UI: now requires reviewer permission. */
export async function finalizeDiagnosticResult(resultId: string): Promise<DiagnosticResult | null> {
  return verifyResult(resultId);
}

/** Correction after verification creates an auditable amended draft (§6). */
export async function amendDiagnosticResult(orderId: string, testId: string): Promise<DiagnosticResult | null> {
  await dbConnect();
  await requirePermission("VERIFY_RESULTS");
  const now = new Date().toISOString();

  const current = await DiagnosticResultModel.findOne({
    orderId,
    testId,
    status: { $in: ["verified", "published", "final", "amended"] },
  })
    .sort({ verifiedAt: -1, finalizedAt: -1 })
    .lean<any>();
  if (!current) return null;

  await DiagnosticResultModel.updateOne(
    { _id: current._id },
    { $set: { status: "amended", updatedAt: now } }
  );

  const draft = await DiagnosticResultModel.create({
    _id: `RS${Date.now()}${Math.floor(Math.random() * 90 + 10)}`,
    orderId,
    testId,
    testName: current.testName,
    category: current.category,
    patientId: current.patientId,
    status: "draft",
    values: current.values,
    notes: current.notes,
    findings: current.findings,
    impression: current.impression,
    amendedFrom: current._id,
    createdAt: now,
    updatedAt: now,
  });

  const order = await findOrder(orderId);
  if (order) {
    await advanceItem(String(order._id), testId, ["verified", "published"], { status: "result_pending" });
    await syncOrderStatus(String(order._id));
  }
  await resultAudit(String(current._id), orderId, "RESULT_AMENDED", { newDraftId: String(draft._id) });
  return normalizeResult(draft.toObject());
}

export async function cancelResult(resultId: string, reason?: string): Promise<DiagnosticResult | undefined> {
  await dbConnect();
  await requirePermission("SUBMIT_RESULTS");
  const now = new Date().toISOString();
  const doc = await DiagnosticResultModel.findOneAndUpdate(
    { _id: resultId, status: { $in: ["draft", "submitted_for_verification", "preliminary"] } },
    { $set: { status: "cancelled", cancelledReason: reason, updatedAt: now } },
    { new: true }
  ).lean<any>();
  if (doc) {
    await resultAudit(resultId, doc.orderId, "RESULT_CANCELLED", { reason });
  }
  return normalizeResult(doc) ?? undefined;
}

export async function markReviewed(resultId: string, reviewerId: string): Promise<DiagnosticResult | undefined> {
  await dbConnect();
  const now = new Date().toISOString();
  const doc = await DiagnosticResultModel.findOneAndUpdate(
    { _id: resultId, reviewedAt: { $exists: false } },
    { $set: { reviewedAt: now, reviewedBy: reviewerId, updatedAt: now } },
    { new: true }
  ).lean<any>();
  if (doc) {
    await resultAudit(resultId, doc.orderId, "RESULT_REVIEWED", { by: reviewerId });
  }
  return normalizeResult(doc) ?? undefined;
}

/* ---------- joined views ---------- */

const VISIBLE_RESULT_STATUSES = ["verified", "published", "final", "amended"];

export async function listDoctorResults(
  doctorId: string
): Promise<Array<{ order: DiagnosticOrder; result: DiagnosticResult; patientName: string }>> {
  await dbConnect();
  const orders = await DiagnosticOrderModel.find({
    doctorId,
    status: { $ne: "cancelled" },
  }).lean<OrderDoc[]>();

  const entries: Array<{ order: DiagnosticOrder; result: DiagnosticResult; patientName: string }> = [];
  for (const od of orders) {
    const order = normalizeOrder(od)!;
    if (!order) continue;
    const results = await DiagnosticResultModel.find({
      orderId: order.id,
      status: { $in: VISIBLE_RESULT_STATUSES },
    }).lean();
    const latestPerTest = new Map<string, any>();
    for (const r of results as any[]) {
      const prev = latestPerTest.get(r.testId);
      if (!prev || (r.finalizedAt ?? r.updatedAt ?? "") > (prev.finalizedAt ?? prev.updatedAt ?? "")) {
        latestPerTest.set(r.testId, r);
      }
    }
    const name = await patientName(order.patientId);
    for (const result of latestPerTest.values()) {
      const nr = normalizeResult(result);
      if (nr) entries.push({ order, result: nr, patientName: name });
    }
  }
  return entries.sort((a, b) =>
    (b.result.verifiedAt ?? b.result.finalizedAt ?? "").localeCompare(a.result.verifiedAt ?? a.result.finalizedAt ?? "")
  );
}

/** Patient-facing view (§23): only verified/published results, criticals only once acknowledged. */
export async function listPatientTests(patientId: string): Promise<PatientTestEntry[]> {
  await dbConnect();
  const orders = await DiagnosticOrderModel.find({
    patientId,
    status: { $nin: ["draft", "cancelled"] },
  })
    .sort({ orderedAt: -1 })
    .lean<OrderDoc[]>();

  const entries: PatientTestEntry[] = [];
  for (const od of orders) {
    const order = normalizeOrder(od)!;
    if (!order) continue;
    const results = await DiagnosticResultModel.find({ orderId: order.id }).lean();
    for (const item of order.items) {
      const matching = (results as any[])
        .filter((r) => r.testId === item.testId)
        .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
      const visible = matching.find((r) => {
        const st = normalizeResultStatus(r.status);
        if (!VISIBLE_RESULT_STATUSES.includes(st)) return false;
        if (r.critical?.parameters?.length && !r.critical.acknowledgedBy) return false;
        return true;
      });
      const latestAny = matching[0];
      entries.push({
        orderId: order.id,
        testId: item.testId,
        testName: item.testName,
        category: item.category,
        orderStatus: order.status,
        resultStatus: visible ? normalizeResultStatus(visible.status) : null,
        resultId: visible ? String(visible._id) : null,
        orderedAt: order.orderedAt ?? order.createdAt,
        reportedAt: visible?.verifiedAt ?? visible?.finalizedAt ?? null,
      });
      void latestAny;
    }
  }
  return entries.sort((a, b) => b.orderedAt.localeCompare(a.orderedAt));
}

/** Doctor investigation tracker (§24): shows in-flight status incl. Verified + View Result. */
export async function listDoctorInvestigations(
  doctorId: string
): Promise<
  Array<{
    orderId: string;
    testId: string;
    testName: string;
    category: DiagnosticCategory;
    itemStatus: ItemWorkflowStatus;
    orderStatus: DiagnosticOrderStatus;
    orderedAt: string;
    resultId: string | null;
    resultStatus: string | null;
    critical: boolean;
    patientName: string;
  }>
> {
  await dbConnect();
  const orders = await DiagnosticOrderModel.find({ doctorId, status: { $ne: "cancelled" } })
    .sort({ orderedAt: -1 })
    .lean<OrderDoc[]>();
  const out: Awaited<ReturnType<typeof listDoctorInvestigations>> = [];
  for (const od of orders) {
    const order = normalizeOrder(od)!;
    if (!order) continue;
    const name = await patientName(order.patientId);
    const results = await DiagnosticResultModel.find({ orderId: order.id }).lean();
    for (const item of order.items) {
      const matching = (results as any[]).filter((r) => r.testId === item.testId);
      const latestVisible = matching
        .filter((r) => VISIBLE_RESULT_STATUSES.includes(normalizeResultStatus(r.status)))
        .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))[0];
      out.push({
        orderId: order.id,
        testId: item.testId,
        testName: item.testName,
        category: item.category,
        itemStatus: normalizeItemStatus(item.workflow?.status),
        orderStatus: order.status,
        orderedAt: order.orderedAt ?? order.createdAt,
        resultId: latestVisible ? String(latestVisible._id) : null,
        resultStatus: latestVisible ? normalizeResultStatus(latestVisible.status) : null,
        critical: Boolean(latestVisible?.critical?.parameters?.length),
        patientName: name,
      });
    }
  }
  return out;
}
