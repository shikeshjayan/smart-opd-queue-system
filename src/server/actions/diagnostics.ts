"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import {
  DiagnosticOrderModel,
  DiagnosticResultModel,
  DiagnosticAuditModel,
  PatientModel,
} from "@/lib/models";
import { plainList, plain } from "@/lib/models";
import { getSession } from "@/lib/auth";
import { testCatalogue, testById } from "@/services/diagnostics/catalog";
import { computeResultFlag } from "@/services/diagnostics/types";
import type {
  CatalogParameter,
  DiagnosticCategory,
  DiagnosticOrder,
  DiagnosticOrderItem,
  DiagnosticResult,
  PatientTestEntry,
  ResultValue,
  Specimen,
  TestCatalogItem,
} from "@/services/diagnostics/types";

/* ---------- helpers ---------- */

type OrderDoc = Record<string, unknown> & { _id?: string };

function normalizeOrder(doc: OrderDoc | null): DiagnosticOrder | null {
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
    items: (d.items ?? d.tests ?? []) as DiagnosticOrderItem[],
    clinicalNotes: d.clinicalNotes ?? d.instructions,
    status: d.status ?? "ordered",
    specimenId: d.specimenId,
    cancelledReason: d.cancelledReason,
  };
}

function normalizeResult(doc: OrderDoc | null): DiagnosticResult | null {
  if (!doc) return null;
  const d = doc as any;
  return {
    id: String(d._id),
    orderId: d.orderId ?? "",
    testId: d.testId ?? "",
    testName: d.testName ?? "",
    category: d.category ?? "laboratory",
    patientId: d.patientId ?? "",
    status: d.status ?? "draft",
    values: (d.values ?? []) as ResultValue[],
    notes: d.notes,
    draftedAt: d.draftedAt ?? d.createdAt,
    finalizedAt: d.finalizedAt,
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

async function patientName(patientId: string): Promise<string> {
  const p = await PatientModel.findOne({ _id: patientId }).lean<{ name?: string } | null>();
  return (p as any)?.name ?? "Patient";
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
  const doc = await DiagnosticOrderModel.findOne({
    $or: [{ _id: orderId }, { orderId }],
  }).lean<OrderDoc | null>();
  return normalizeOrder(doc) ?? undefined;
}

export async function createDraft(
  encounterId: string,
  ref: { patientId: string; doctorId: string; doctorName: string; hospitalId: string; hospitalName: string; departmentName: string },
  items: DiagnosticOrderItem[],
  clinicalNotes?: string
): Promise<DiagnosticOrder> {
  await dbConnect();
  const now = new Date().toISOString();
  const doc = await DiagnosticOrderModel.create({
    _id: `LAB${Date.now()}`,
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
  const now = new Date().toISOString();
  const doc = await DiagnosticOrderModel.findOneAndUpdate(
    { $or: [{ _id: orderId }, { orderId }], status: "draft" },
    { $set: { status: "ordered", orderedAt: now, updatedAt: now } },
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
      status: { $in: ["draft", "ordered", "sample_collected"] },
    },
    { $set: { status: "cancelled", cancelledReason: reason, updatedAt: now } },
    { new: true }
  ).lean<OrderDoc | null>();
  if (doc) await audit(String((doc as any)._id), "order_cancelled", { reason });
  return normalizeOrder(doc) ?? undefined;
}

/* ---------- specimens ---------- */

export async function getSpecimenForOrder(orderId: string): Promise<Specimen | undefined> {
  await dbConnect();
  const doc = await DiagnosticOrderModel.findOne({
    $or: [{ _id: orderId }, { orderId }],
  }).lean<OrderDoc | null>();
  const raw = (doc as any)?.specimens?.[0];
  return normalizeSpecimen(raw ? { ...raw, orderId: String(raw.orderId ?? (doc as any).orderId ?? (doc as any)._id) } : null) ?? undefined;
}

export async function collectSpecimen(orderId: string, type: string): Promise<Specimen | undefined> {
  await dbConnect();
  const now = new Date().toISOString();
  const session = await getSession();
  const order = await DiagnosticOrderModel.findOne({
    $or: [{ _id: orderId }, { orderId }],
    status: { $in: ["ordered", "sample_collected"] },
  }).lean<any>();
  if (!order) return undefined;

  const existing = (order.specimens ?? [])[0];
  const specimen = existing ?? {
    id: `SP${Date.now()}`,
    orderId: String(order.orderId ?? order._id),
    patientId: order.patientId ?? "",
    type,
    status: "collected",
    collectedAt: now,
    createdAt: now,
    collectedBy: session?.id,
  };
  if (!existing && type) specimen.type = type;

  await DiagnosticOrderModel.updateOne(
    { _id: order._id },
    { $set: { specimens: [specimen], status: "sample_collected", updatedAt: now } }
  );
  await audit(String(order._id), "specimen_collected", { type });
  return normalizeSpecimen(specimen) ?? undefined;
}

export async function rejectSpecimen(orderId: string, reason: string): Promise<Specimen | undefined> {
  await dbConnect();
  const now = new Date().toISOString();
  const order = await DiagnosticOrderModel.findOne({
    $or: [{ _id: orderId }, { orderId }],
  }).lean<any>();
  if (!order) return undefined;

  const specimens = order.specimens ?? [];
  if (!specimens.length) return undefined;
  specimens[0] = { ...specimens[0], status: "rejected", rejectionReason: reason };

  await DiagnosticOrderModel.updateOne(
    { _id: order._id },
    { $set: { specimens, updatedAt: now } }
  );
  await audit(String(order._id), "specimen_rejected", { reason });
  return normalizeSpecimen(specimens[0]) ?? undefined;
}

export async function startProcessing(orderId: string): Promise<Specimen | undefined> {
  await dbConnect();
  const now = new Date().toISOString();
  const order = await DiagnosticOrderModel.findOne({
    $or: [{ _id: orderId }, { orderId }],
    status: "sample_collected",
  }).lean<any>();
  if (!order) return undefined;

  const specimens = order.specimens ?? [];
  if (specimens.length) specimens[0] = { ...specimens[0], status: "processing" };

  await DiagnosticOrderModel.updateOne(
    { _id: order._id },
    { $set: { specimens, status: "processing", updatedAt: now } }
  );
  await audit(String(order._id), "processing_started");
  return specimens.length ? (normalizeSpecimen(specimens[0]) ?? undefined) : undefined;
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

export async function saveResultDraft(
  orderId: string,
  testId: string,
  values: ResultValue[],
  notes?: string
): Promise<DiagnosticResult | undefined> {
  await dbConnect();
  const now = new Date().toISOString();
  const test = testById(testId);

  // attach computed flags for numeric parameters missing flags
  const enriched: ResultValue[] = values.map((v) => {
    if (v.flag !== null && v.flag !== undefined) return v;
    const param: CatalogParameter | undefined = test?.parameters.find((p) => p.key === v.parameterKey);
    if (!param) return v;
    return { ...v, flag: computeResultFlag(v.value, param) };
  });

  const existing = await DiagnosticResultModel.findOne({ orderId, testId, status: "draft" }).lean<any>();
  let doc;
  if (existing) {
    doc = await DiagnosticResultModel.findOneAndUpdate(
      { _id: existing._id, status: "draft" },
      { $set: { values: enriched, notes, updatedAt: now } },
      { new: true }
    ).lean();
  } else {
    doc = await DiagnosticResultModel.create({
      _id: `RS${Date.now()}`,
      orderId,
      testId,
      testName: test?.name ?? testId,
      category: test?.category ?? "laboratory",
      patientId: (await getOrder(orderId))?.patientId ?? "",
      status: "draft",
      values: enriched,
      notes,
      draftedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }
  await audit(orderId, "result_draft_saved", { testId });
  return normalizeResult(doc) ?? undefined;
}

export async function finalizeDiagnosticResult(resultId: string): Promise<DiagnosticResult | null> {
  await dbConnect();
  const now = new Date().toISOString();

  const doc = await DiagnosticResultModel.findOneAndUpdate(
    { _id: resultId, status: { $in: ["draft", "preliminary"] } },
    { $set: { status: "final", finalizedAt: now, updatedAt: now } },
    { new: true }
  ).lean();

  if (doc) {
    await DiagnosticAuditModel.create({
      resultId,
      orderId: (doc as any).orderId,
      action: "RESULT_FINALIZED",
      actorId: (await getSession())?.id,
      createdAt: now,
    });
    // mark order completed when every ordered test has a final result
    const order = await getOrder((doc as any).orderId);
    if (order) {
      const finals = await DiagnosticResultModel.find({
        orderId: order.id,
        status: { $in: ["final", "amended"] },
      }).lean();
      const finalTests = new Set((finals as any[]).map((f) => f.testId));
      const allOrdered = order.items.every((i) => finalTests.has(i.testId));
      if (allOrdered && order.status !== "completed") {
        await DiagnosticOrderModel.updateOne(
          { $or: [{ _id: order.id }, { orderId: order.id }] },
          { $set: { status: "completed", completedAt: now, updatedAt: now } }
        );
        await audit(order.id, "order_completed");
      }
    }
  }
  return normalizeResult(doc);
}

export async function amendDiagnosticResult(orderId: string, testId: string): Promise<DiagnosticResult | null> {
  await dbConnect();
  const now = new Date().toISOString();

  const current = await DiagnosticResultModel.findOne({ orderId, testId, status: "final" })
    .sort({ finalizedAt: -1 })
    .lean<any>();
  if (!current) return null;

  await DiagnosticResultModel.updateOne(
    { _id: current._id },
    { $set: { status: "amended", updatedAt: now } }
  );

  const draft = await DiagnosticResultModel.create({
    _id: `RS${Date.now()}`,
    orderId,
    testId,
    testName: current.testName,
    category: current.category,
    patientId: current.patientId,
    status: "draft",
    values: current.values,
    notes: current.notes,
    amendedFrom: current._id,
    createdAt: now,
    updatedAt: now,
  });

  await DiagnosticAuditModel.create({
    resultId: String(current._id),
    orderId,
    action: "RESULT_AMENDED",
    actorId: (await getSession())?.id,
    createdAt: now,
  });

  return normalizeResult(draft.toObject());
}

export async function cancelResult(resultId: string, reason?: string): Promise<DiagnosticResult | undefined> {
  await dbConnect();
  const now = new Date().toISOString();
  const doc = await DiagnosticResultModel.findOneAndUpdate(
    { _id: resultId, status: { $in: ["draft", "preliminary"] } },
    { $set: { status: "cancelled", cancelledReason: reason, updatedAt: now } },
    { new: true }
  ).lean();
  if (doc) {
    await DiagnosticAuditModel.create({
      resultId,
      orderId: (doc as any).orderId,
      action: "RESULT_CANCELLED",
      actorId: (await getSession())?.id,
      detail: { reason },
      createdAt: now,
    });
  }
  return normalizeResult(doc) ?? undefined;
}

export async function markReviewed(resultId: string, reviewerId: string): Promise<DiagnosticResult | undefined> {
  await dbConnect();
  const now = new Date().toISOString();
  const doc = await DiagnosticResultModel.findOneAndUpdate(
    { _id: resultId, status: { $in: ["final", "amended"] }, reviewedAt: { $exists: false } },
    { $set: { reviewedAt: now, reviewedBy: reviewerId, updatedAt: now } },
    { new: true }
  ).lean();
  if (doc) {
    await DiagnosticAuditModel.create({
      resultId,
      orderId: (doc as any).orderId,
      action: "RESULT_REVIEWED",
      actorId: reviewerId,
      createdAt: now,
    });
  }
  return normalizeResult(doc) ?? undefined;
}

/* ---------- joined views ---------- */

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
      status: { $in: ["final", "amended"] },
    }).lean();
    const latestPerTest = new Map<string, any>();
    for (const r of results as any[]) {
      const prev = latestPerTest.get(r.testId);
      if (!prev || (r.finalizedAt ?? "") > (prev.finalizedAt ?? "")) latestPerTest.set(r.testId, r);
    }
    const name = await patientName(order.patientId);
    for (const result of latestPerTest.values()) {
      const nr = normalizeResult(result);
      if (nr) entries.push({ order, result: nr, patientName: name });
    }
  }
  return entries.sort((a, b) => (b.result.finalizedAt ?? "").localeCompare(a.result.finalizedAt ?? ""));
}

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
        .sort((a, b) => (b.finalizedAt ?? "").localeCompare(a.finalizedAt ?? ""));
      const latest = matching.find((r) => r.status === "final" || r.status === "amended") ?? matching[0];
      entries.push({
        orderId: order.id,
        testId: item.testId,
        testName: item.testName,
        category: item.category,
        orderStatus: order.status,
        resultStatus: latest?.status ?? null,
        resultId: latest ? String(latest._id) : null,
        orderedAt: order.orderedAt ?? order.createdAt,
        reportedAt: latest?.finalizedAt ?? null,
      });
    }
  }
  return entries.sort((a, b) => b.orderedAt.localeCompare(a.orderedAt));
}
