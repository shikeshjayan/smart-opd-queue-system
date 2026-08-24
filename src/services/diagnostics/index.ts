import type { Encounter } from "@/types";
import { getPatient } from "../data";
import { auditService } from "@/services/security";
import { getCurrentActor } from "@/features/security/utils/current-actor";
import { integrationService } from "@/integrations/service";
import type {
  CatalogParameter,
  DiagnosticCategory,
  DiagnosticOrder,
  DiagnosticOrderContextRef,
  DiagnosticOrderItem,
  DiagnosticResult,
  PatientTestEntry,
  ResultValue,
  Specimen,
  TestCatalogItem,
} from "./types";
import { computeResultFlag } from "./types";

const delay = () => new Promise((resolve) => setTimeout(resolve, 250));

const ORDERS_KEY = "smart-health.diagnostic-orders";
const SPECIMENS_KEY = "smart-health.diagnostic-specimens";
const RESULTS_KEY = "smart-health.diagnostic-results";

const testCatalogue: TestCatalogItem[] = [
  {
    id: "t_cbc",
    name: "Complete Blood Count",
    category: "laboratory",
    specimenType: "Blood",
    parameters: [
      { key: "hb", name: "Hemoglobin", unit: "g/dL", refLow: 13, refHigh: 17, numeric: true },
      { key: "wbc", name: "WBC", unit: "/µL", refLow: 4000, refHigh: 11000, numeric: true },
      { key: "plt", name: "Platelets", unit: "lakh/µL", refLow: 1.5, refHigh: 4.5, numeric: true },
    ],
  },
  {
    id: "t_fbg",
    name: "Blood Glucose (Fasting)",
    category: "laboratory",
    specimenType: "Blood",
    parameters: [
      { key: "glu", name: "Glucose (Fasting)", unit: "mg/dL", refLow: 70, refHigh: 110, numeric: true },
    ],
  },
  {
    id: "t_lipid",
    name: "Lipid Profile",
    category: "laboratory",
    specimenType: "Blood",
    parameters: [
      { key: "chol", name: "Total Cholesterol", unit: "mg/dL", refHigh: 200, refText: "< 200", numeric: true },
      { key: "ldl", name: "LDL", unit: "mg/dL", refLow: 70, refHigh: 130, numeric: true },
      { key: "hdl", name: "HDL", unit: "mg/dL", refLow: 40, refHigh: 60, numeric: true },
      { key: "tg", name: "Triglycerides", unit: "mg/dL", refHigh: 150, refText: "< 150", numeric: true },
    ],
  },
  {
    id: "t_hba1c",
    name: "HbA1c",
    category: "laboratory",
    specimenType: "Blood",
    parameters: [{ key: "hba1c", name: "HbA1c", unit: "%", refLow: 4, refHigh: 5.6, numeric: true }],
  },
  {
    id: "t_rft",
    name: "Renal Function Test",
    category: "laboratory",
    specimenType: "Blood",
    parameters: [
      { key: "cr", name: "Creatinine", unit: "mg/dL", refLow: 0.6, refHigh: 1.3, numeric: true },
      { key: "urea", name: "Urea", unit: "mg/dL", refLow: 15, refHigh: 45, numeric: true },
    ],
  },
  {
    id: "t_lft",
    name: "Liver Function Test",
    category: "laboratory",
    specimenType: "Blood",
    parameters: [
      { key: "alt", name: "ALT", unit: "U/L", refLow: 7, refHigh: 56, numeric: true },
      { key: "ast", name: "AST", unit: "U/L", refLow: 10, refHigh: 40, numeric: true },
    ],
  },
  {
    id: "t_tsh",
    name: "Thyroid Stimulating Hormone",
    category: "laboratory",
    specimenType: "Blood",
    parameters: [{ key: "tsh", name: "TSH", unit: "mIU/L", refLow: 0.4, refHigh: 4.0, numeric: true }],
  },
  {
    id: "t_urine",
    name: "Urine Routine",
    category: "laboratory",
    specimenType: "Urine",
    parameters: [
      { key: "alb", name: "Albumin", refText: "Negative", numeric: false },
      { key: "sugar", name: "Sugar", refText: "Negative", numeric: false },
      { key: "pus", name: "Pus cells", refText: "Nil", numeric: false },
    ],
  },
  {
    id: "t_cxr",
    name: "Chest X-Ray",
    category: "imaging",
    specimenType: "Image",
    parameters: [{ key: "impression", name: "Impression", numeric: false }],
  },
  {
    id: "t_usg",
    name: "Ultrasound Abdomen",
    category: "imaging",
    specimenType: "Image",
    parameters: [{ key: "impression", name: "Impression", numeric: false }],
  },
  {
    id: "t_ecg",
    name: "ECG (12-lead)",
    category: "other",
    specimenType: "Tracing",
    parameters: [{ key: "impression", name: "Impression", numeric: false }],
  },
];

const CGH = "Government Hospital Ernakulam";
const CARD = "Cardiology";
const GEN = "General Medicine";

function seedOrders(): DiagnosticOrder[] {
  return [
    {
      id: "LAB-10021",
      priority: "routine",
      patientId: "P10294",
      encounterId: "E20260815002",
      doctorId: "doc_001",
      doctorName: "Dr. Anil Kumar",
      hospitalId: "ernakulam-gh",
      hospitalName: CGH,
      departmentName: CARD,
      createdAt: "2026-08-20T09:10:00",
      orderedAt: "2026-08-20T09:10:00",
      status: "sample_collected",
      specimenId: "SPC-10021",
      items: [{ testId: "t_cbc", testName: "Complete Blood Count", category: "laboratory", priority: "routine" }],
      clinicalNotes: "Post-consultation baseline work-up.",
    },
    {
      id: "LAB-10022",
      priority: "routine",
      patientId: "P10294",
      encounterId: "E20260815002",
      doctorId: "doc_001",
      doctorName: "Dr. Anil Kumar",
      hospitalId: "ernakulam-gh",
      hospitalName: CGH,
      departmentName: CARD,
      createdAt: "2026-08-20T09:12:00",
      orderedAt: "2026-08-20T09:12:00",
      status: "processing",
      specimenId: "SPC-10022",
      items: [{ testId: "t_fbg", testName: "Blood Glucose (Fasting)", category: "laboratory", priority: "routine" }],
    },
    {
      id: "LAB-10023",
      priority: "routine",
      patientId: "P10294",
      encounterId: "E20260815002",
      doctorId: "doc_001",
      doctorName: "Dr. Anil Kumar",
      hospitalId: "ernakulam-gh",
      hospitalName: CGH,
      departmentName: CARD,
      createdAt: "2026-08-19T15:20:00",
      orderedAt: "2026-08-19T15:20:00",
      completedAt: "2026-08-20T08:40:00",
      status: "completed",
      specimenId: "SPC-10023",
      items: [{ testId: "t_lipid", testName: "Lipid Profile", category: "laboratory", priority: "routine" }],
    },
    {
      id: "LAB-10024",
      priority: "routine",
      patientId: "P10294",
      encounterId: "E20260815002",
      doctorId: "doc_001",
      doctorName: "Dr. Anil Kumar",
      hospitalId: "ernakulam-gh",
      hospitalName: CGH,
      departmentName: CARD,
      createdAt: "2026-08-16T10:05:00",
      orderedAt: "2026-08-16T10:05:00",
      completedAt: "2026-08-16T12:20:00",
      status: "completed",
      specimenId: "SPC-10024",
      items: [{ testId: "t_cbc", testName: "Complete Blood Count", category: "laboratory", priority: "routine" }],
    },
    {
      id: "LAB-10027",
      priority: "routine",
      patientId: "P10294",
      encounterId: "E20260810001",
      doctorId: "doc_002",
      doctorName: "Dr. Geetha Nair",
      hospitalId: "ernakulam-gh",
      hospitalName: CGH,
      departmentName: GEN,
      createdAt: "2026-04-18T09:30:00",
      orderedAt: "2026-04-18T09:30:00",
      completedAt: "2026-04-18T13:00:00",
      status: "completed",
      specimenId: "SPC-10027",
      items: [{ testId: "t_fbg", testName: "Blood Glucose (Fasting)", category: "laboratory", priority: "routine" }],
    },
    {
      id: "LAB-10025",
      priority: "routine",
      patientId: "P10421",
      encounterId: "E20260819003",
      doctorId: "doc_001",
      doctorName: "Dr. Anil Kumar",
      hospitalId: "ernakulam-gh",
      hospitalName: CGH,
      departmentName: CARD,
      createdAt: "2026-08-20T09:40:00",
      orderedAt: "2026-08-20T09:40:00",
      status: "ordered",
      items: [{ testId: "t_urine", testName: "Urine Routine", category: "laboratory", priority: "routine" }],
      clinicalNotes: "Rule out urinary tract infection.",
    },
    {
      id: "LAB-10026",
      priority: "routine",
      patientId: "P10421",
      encounterId: "E20260819003",
      doctorId: "doc_001",
      doctorName: "Dr. Anil Kumar",
      hospitalId: "ernakulam-gh",
      hospitalName: CGH,
      departmentName: CARD,
      createdAt: "2026-08-19T11:00:00",
      orderedAt: "2026-08-19T11:00:00",
      completedAt: "2026-08-19T17:30:00",
      status: "completed",
      specimenId: "SPC-10026",
      items: [{ testId: "t_cxr", testName: "Chest X-Ray", category: "imaging", priority: "routine" }],
    },
  ];
}

function seedSpecimens(): Specimen[] {
  return [
    { id: "SPC-10021", orderId: "LAB-10021", patientId: "P10294", type: "Blood", status: "collected", collectedAt: "2026-08-20T10:15:00", createdAt: "2026-08-20T09:10:00" },
    { id: "SPC-10022", orderId: "LAB-10022", patientId: "P10294", type: "Blood", status: "processing", collectedAt: "2026-08-20T10:20:00", createdAt: "2026-08-20T09:12:00" },
    { id: "SPC-10023", orderId: "LAB-10023", patientId: "P10294", type: "Blood", status: "completed", collectedAt: "2026-08-19T16:00:00", createdAt: "2026-08-19T15:20:00" },
    { id: "SPC-10024", orderId: "LAB-10024", patientId: "P10294", type: "Blood", status: "completed", collectedAt: "2026-08-16T10:30:00", createdAt: "2026-08-16T10:05:00" },
    { id: "SPC-10027", orderId: "LAB-10027", patientId: "P10294", type: "Blood", status: "completed", collectedAt: "2026-04-18T09:45:00", createdAt: "2026-04-18T09:30:00" },
    { id: "SPC-10026", orderId: "LAB-10026", patientId: "P10421", type: "Image", status: "completed", collectedAt: "2026-08-19T12:00:00", createdAt: "2026-08-19T11:00:00" },
  ];
}

function seedResults(): DiagnosticResult[] {
  return [
    {
      id: "RS-10023",
      orderId: "LAB-10023",
      testId: "t_lipid",
      testName: "Lipid Profile",
      category: "laboratory",
      patientId: "P10294",
      status: "final",
      draftedAt: "2026-08-20T08:20:00",
      finalizedAt: "2026-08-20T08:40:00",
      values: [
        { parameterKey: "chol", name: "Total Cholesterol", unit: "mg/dL", value: "218", refText: "< 200", refHigh: 200, flag: "high" },
        { parameterKey: "ldl", name: "LDL", unit: "mg/dL", value: "152", refLow: 70, refHigh: 130, flag: "high" },
        { parameterKey: "hdl", name: "HDL", unit: "mg/dL", value: "38", refLow: 40, refHigh: 60, flag: "low" },
        { parameterKey: "tg", name: "Triglycerides", unit: "mg/dL", value: "165", refText: "< 150", refHigh: 150, flag: "high" },
      ],
    },
    {
      id: "RS-10024",
      orderId: "LAB-10024",
      testId: "t_cbc",
      testName: "Complete Blood Count",
      category: "laboratory",
      patientId: "P10294",
      status: "final",
      draftedAt: "2026-08-16T11:50:00",
      finalizedAt: "2026-08-16T12:20:00",
      reviewedAt: "2026-08-16T14:10:00",
      reviewedBy: "doc_001",
      values: [
        { parameterKey: "hb", name: "Hemoglobin", unit: "g/dL", value: "13.2", refLow: 13, refHigh: 17, flag: "normal" },
        { parameterKey: "wbc", name: "WBC", unit: "/µL", value: "7600", refLow: 4000, refHigh: 11000, flag: "normal" },
        { parameterKey: "plt", name: "Platelets", unit: "lakh/µL", value: "2.4", refLow: 1.5, refHigh: 4.5, flag: "normal" },
      ],
    },
    {
      id: "RS-10027",
      orderId: "LAB-10027",
      testId: "t_fbg",
      testName: "Blood Glucose (Fasting)",
      category: "laboratory",
      patientId: "P10294",
      status: "final",
      draftedAt: "2026-04-18T10:20:00",
      finalizedAt: "2026-04-18T13:00:00",
      reviewedAt: "2026-04-18T15:00:00",
      reviewedBy: "doc_002",
      values: [
        { parameterKey: "glu", name: "Glucose (Fasting)", unit: "mg/dL", value: "168", refLow: 70, refHigh: 110, flag: "high" },
      ],
    },
    {
      id: "RS-10026",
      orderId: "LAB-10026",
      testId: "t_cxr",
      testName: "Chest X-Ray",
      category: "imaging",
      patientId: "P10421",
      status: "final",
      draftedAt: "2026-08-19T16:40:00",
      finalizedAt: "2026-08-19T17:30:00",
      reviewedAt: "2026-08-20T08:00:00",
      reviewedBy: "doc_001",
      values: [
        { parameterKey: "impression", name: "Impression", value: "No acute cardiopulmonary abnormality. Heart size normal.", flag: null },
      ],
    },
  ];
}

function load<T>(key: string, seed: () => T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T[];
  } catch {
    // ignore corrupt storage
  }
  const seeded = seed();
  try {
    localStorage.setItem(key, JSON.stringify(seeded));
  } catch {
    // storage unavailable
  }
  return seeded;
}

function save<T>(key: string, value: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable
  }
}

let orders: DiagnosticOrder[] | null = null;
let specimens: Specimen[] | null = null;
let results: DiagnosticResult[] | null = null;

function ensureLoaded(): void {
  if (orders === null) orders = load(ORDERS_KEY, seedOrders);
  if (specimens === null) specimens = load(SPECIMENS_KEY, seedSpecimens);
  if (results === null) results = load(RESULTS_KEY, seedResults);
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function testById(id: string): TestCatalogItem | undefined {
  return testCatalogue.find((test) => test.id === id);
}

function refreshOrderStatus(orderId: string): void {
  const list = orders ?? [];
  const index = list.findIndex((o) => o.id === orderId);
  if (index === -1 || list[index].status === "cancelled") return;
  const order = list[index];
  const allFinalised = order.items.every((item) =>
    (results ?? []).some(
      (r) => r.orderId === orderId && r.testId === item.testId && r.status !== "draft"
    )
  );
  if (allFinalised && order.status !== "completed") {
    list[index] = { ...order, status: "completed", completedAt: nowIso() };
    save(ORDERS_KEY, list);
  }
}

export const diagnosticsService = {
  async searchTests(query: string, category?: DiagnosticCategory): Promise<TestCatalogItem[]> {
    await delay();
    const q = query.trim().toLowerCase();
    return testCatalogue
      .filter((test) => (category ? test.category === category : true))
      .filter((test) => !q || test.name.toLowerCase().includes(q))
      .slice(0, 25);
  },

  async listTests(): Promise<TestCatalogItem[]> {
    await delay();
    return [...testCatalogue];
  },

  async listForEncounter(encounterId: string): Promise<DiagnosticOrder[]> {
    await delay();
    ensureLoaded();
    return (orders ?? []).filter((o) => o.encounterId === encounterId);
  },

  async listForPatient(patientId: string): Promise<DiagnosticOrder[]> {
    await delay();
    ensureLoaded();
    return (orders ?? [])
      .filter((o) => o.patientId === patientId)
      .sort((a, b) => (b.orderedAt ?? b.createdAt).localeCompare(a.orderedAt ?? a.createdAt));
  },

  async listAll(): Promise<DiagnosticOrder[]> {
    await delay();
    ensureLoaded();
    return [...(orders ?? [])].sort((a, b) =>
      (b.orderedAt ?? b.createdAt).localeCompare(a.orderedAt ?? a.createdAt)
    );
  },

  async getOrder(orderId: string): Promise<DiagnosticOrder | undefined> {
    await delay();
    ensureLoaded();
    return (orders ?? []).find((o) => o.id === orderId);
  },

  async createDraft(
    encounterId: string,
    ref: DiagnosticOrderContextRef,
    items: DiagnosticOrderItem[],
    clinicalNotes?: string
  ): Promise<DiagnosticOrder> {
    await delay();
    ensureLoaded();
    const order: DiagnosticOrder = {
      id: nextId("LAB"),
      patientId: ref.patientId,
      encounterId,
      doctorId: ref.doctorId,
      doctorName: ref.doctorName,
      hospitalId: ref.hospitalId,
      hospitalName: ref.hospitalName,
      departmentName: ref.departmentName,
      createdAt: nowIso(),
      items,
      clinicalNotes,
      priority: "routine",
      status: "draft",
    };
    orders = [order, ...(orders ?? [])];
    save(ORDERS_KEY, orders);
    return order;
  },

  async updateDraft(orderId: string, items: DiagnosticOrderItem[], clinicalNotes?: string): Promise<DiagnosticOrder | undefined> {
    await delay();
    ensureLoaded();
    const list = orders ?? [];
    const index = list.findIndex((o) => o.id === orderId);
    if (index === -1 || list[index].status !== "draft") return undefined;
    list[index] = { ...list[index], items, clinicalNotes };
    orders = list;
    save(ORDERS_KEY, orders);
    return list[index];
  },

  async submitOrder(orderId: string): Promise<DiagnosticOrder | undefined> {
    await delay();
    ensureLoaded();
    const list = orders ?? [];
    const index = list.findIndex((o) => o.id === orderId);
    if (index === -1 || list[index].status !== "draft") return undefined;
    list[index] = { ...list[index], status: "ordered", orderedAt: nowIso() };
    orders = list;
    save(ORDERS_KEY, orders);
    return list[index];
  },

  async cancelOrder(orderId: string, reason?: string): Promise<DiagnosticOrder | undefined> {
    await delay();
    ensureLoaded();
    const list = orders ?? [];
    const index = list.findIndex((o) => o.id === orderId);
    if (index === -1) return undefined;
    list[index] = { ...list[index], status: "cancelled", cancelledReason: reason };
    orders = list;
    save(ORDERS_KEY, orders);
    return list[index];
  },

  async getSpecimenForOrder(orderId: string): Promise<Specimen | undefined> {
    ensureLoaded();
    return (specimens ?? []).find((s) => s.orderId === orderId);
  },

  async collectSpecimen(orderId: string, type: string): Promise<Specimen | undefined> {
    await delay();
    ensureLoaded();
    const specimen: Specimen = {
      id: nextId("SPC"),
      orderId,
      patientId: "",
      type,
      status: "collected",
      collectedAt: nowIso(),
      createdAt: nowIso(),
    };
    const order = (orders ?? []).find((o) => o.id === orderId);
    if (!order) return undefined;
    specimen.patientId = order.patientId;
    specimens = [specimen, ...(specimens ?? [])];
    save(SPECIMENS_KEY, specimens);
    const list = orders ?? [];
    const index = list.findIndex((o) => o.id === orderId);
    if (index !== -1) {
      list[index] = { ...list[index], status: "sample_collected", specimenId: specimen.id };
      orders = list;
      save(ORDERS_KEY, orders);
    }
    return specimen;
  },

  async rejectSpecimen(orderId: string, reason: string): Promise<Specimen | undefined> {
    await delay();
    ensureLoaded();
    const specimen = (specimens ?? []).find((s) => s.orderId === orderId);
    if (!specimen || specimen.status === "rejected") return specimen;
    const next = (specimens ?? []).map((s) =>
      s.id === specimen.id ? { ...s, status: "rejected" as const, rejectionReason: reason } : s
    );
    specimens = next;
    save(SPECIMENS_KEY, specimens);
    const list = orders ?? [];
    const index = list.findIndex((o) => o.id === orderId);
    if (index !== -1) {
      list[index] = { ...list[index], status: "ordered", specimenId: undefined };
      orders = list;
      save(ORDERS_KEY, orders);
    }
    return next.find((s) => s.id === specimen.id);
  },

  async startProcessing(orderId: string): Promise<Specimen | undefined> {
    await delay();
    ensureLoaded();
    const specimen = (specimens ?? []).find((s) => s.orderId === orderId);
    if (specimen) {
      specimens = (specimens ?? []).map((s) =>
        s.id === specimen.id ? { ...s, status: "processing" as const } : s
      );
      save(SPECIMENS_KEY, specimens);
    }
    const list = orders ?? [];
    const index = list.findIndex((o) => o.id === orderId);
    if (index !== -1) {
      list[index] = { ...list[index], status: "processing" };
      orders = list;
      save(ORDERS_KEY, orders);
    }
    return specimens?.find((s) => s.id === specimen?.id);
  },

  async listResultsForOrder(orderId: string): Promise<DiagnosticResult[]> {
    await delay();
    ensureLoaded();
    return (results ?? [])
      .filter((r) => r.orderId === orderId)
      .sort((a, b) => (b.finalizedAt ?? b.draftedAt ?? "").localeCompare(a.finalizedAt ?? a.draftedAt ?? ""));
  },

  async getResult(resultId: string): Promise<DiagnosticResult | undefined> {
    await delay();
    ensureLoaded();
    return (results ?? []).find((r) => r.id === resultId);
  },

  async saveResultDraft(
    orderId: string,
    testId: string,
    values: ResultValue[],
    notes?: string
  ): Promise<DiagnosticResult | undefined> {
    await delay();
    ensureLoaded();
    const test = testById(testId);
    const existing = (results ?? []).find(
      (r) => r.orderId === orderId && r.testId === testId && r.status === "draft"
    );
    const draft: DiagnosticResult = {
      id: existing?.id ?? nextId("RS"),
      orderId,
      testId,
      testName: test?.name ?? testId,
      category: test?.category ?? "laboratory",
      patientId: (orders ?? []).find((o) => o.id === orderId)?.patientId ?? "",
      status: "draft",
      values,
      notes,
      draftedAt: nowIso(),
      amendedFrom: existing?.amendedFrom,
    };
    const next = existing
      ? (results ?? []).map((r) => (r.id === existing.id && r.status === "draft" ? draft : r))
      : [draft, ...(results ?? [])];
    results = next;
    save(RESULTS_KEY, results);
    return draft;
  },

  async finalizeResult(resultId: string): Promise<DiagnosticResult | undefined> {
    await delay();
    ensureLoaded();
    const list = results ?? [];
    const index = list.findIndex((r) => r.id === resultId);
    if (index === -1 || list[index].status !== "draft") return undefined;
    list[index] = { ...list[index], status: "final", finalizedAt: nowIso() };
    results = list;
    save(RESULTS_KEY, results);
    refreshOrderStatus(list[index].orderId);
    const actor = getCurrentActor();
    if (actor) {
      auditService.log({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "DIAGNOSTIC_RESULT_FINALIZED",
        resourceType: "Diagnostic Result",
        resourceId: resultId,
        hospitalId: (orders ?? []).find((o) => o.id === list[index].orderId)?.hospitalId,
        districtId: actor.scope.districtId,
        result: "success",
      });
    }
    integrationService.enqueueEvent("lab.result.sync", resultId, "laboratory");
    return list[index];
  },

  async amendResult(orderId: string, testId: string): Promise<DiagnosticResult | undefined> {
    await delay();
    ensureLoaded();
    const current = (results ?? []).find(
      (r) => r.orderId === orderId && r.testId === testId && r.status === "final"
    );
    if (!current) return undefined;
    results = (results ?? []).map((r) => (r.id === current.id ? { ...r, status: "amended" as const } : r));
    const draft: DiagnosticResult = {
      id: nextId("RS"),
      orderId,
      testId,
      testName: current.testName,
      category: current.category,
      patientId: current.patientId,
      status: "draft",
      values: current.values.map((v) => ({ ...v })),
      notes: current.notes,
      draftedAt: nowIso(),
      amendedFrom: current.id,
    };
    results = [draft, ...(results ?? [])];
    save(RESULTS_KEY, results);
    return draft;
  },

  async cancelResult(resultId: string, reason?: string): Promise<DiagnosticResult | undefined> {
    await delay();
    ensureLoaded();
    const list = results ?? [];
    const index = list.findIndex((r) => r.id === resultId);
    if (index === -1) return undefined;
    list[index] = { ...list[index], status: "cancelled", cancelledReason: reason };
    results = list;
    save(RESULTS_KEY, results);
    return list[index];
  },

  async markReviewed(resultId: string, reviewerId: string): Promise<DiagnosticResult | undefined> {
    await delay();
    ensureLoaded();
    const list = results ?? [];
    const index = list.findIndex((r) => r.id === resultId);
    if (index === -1) return undefined;
    list[index] = { ...list[index], reviewedAt: nowIso(), reviewedBy: reviewerId };
    results = list;
    save(RESULTS_KEY, results);
    return list[index];
  },

  async listDoctorResults(doctorId: string): Promise<Array<{ order: DiagnosticOrder; result: DiagnosticResult; patientName: string }>> {
    await delay();
    ensureLoaded();
    const doctorOrders = (orders ?? []).filter((o) => o.doctorId === doctorId && o.status !== "cancelled");
    const entries: Array<{ order: DiagnosticOrder; result: DiagnosticResult; patientName: string }> = [];
    for (const order of doctorOrders) {
      const orderResults = (results ?? []).filter(
        (r) => r.orderId === order.id && (r.status === "final" || r.status === "amended")
      );
      const latestPerTest = new Map<string, DiagnosticResult>();
      for (const r of orderResults) {
        const prev = latestPerTest.get(r.testId);
        if (!prev || (r.finalizedAt ?? "") > (prev.finalizedAt ?? "")) latestPerTest.set(r.testId, r);
      }
      for (const result of latestPerTest.values()) {
        entries.push({
          order,
          result,
          patientName: getPatient(order.patientId)?.name ?? "Patient",
        });
      }
    }
    return entries.sort((a, b) =>
      (b.result.finalizedAt ?? "").localeCompare(a.result.finalizedAt ?? "")
    );
  },

  async listPatientTests(patientId: string): Promise<PatientTestEntry[]> {
    await delay();
    ensureLoaded();
    const patientOrders = (orders ?? [])
      .filter((o) => o.patientId === patientId && o.status !== "draft" && o.status !== "cancelled")
      .sort((a, b) => (b.orderedAt ?? b.createdAt).localeCompare(a.orderedAt ?? a.createdAt));
    const entries: PatientTestEntry[] = [];
    for (const order of patientOrders) {
      const orderResults = (results ?? []).filter((r) => r.orderId === order.id);
      for (const item of order.items) {
        const result = orderResults
          .filter((r) => r.testId === item.testId && r.status !== "draft")
          .sort((a, b) => (b.finalizedAt ?? "").localeCompare(a.finalizedAt ?? ""))[0];
        entries.push({
          orderId: order.id,
          testId: item.testId,
          testName: item.testName,
          category: item.category,
          orderStatus: order.status,
          resultStatus: result?.status ?? null,
          resultId: result?.id ?? null,
          orderedAt: order.orderedAt ?? order.createdAt,
          reportedAt: result?.finalizedAt ?? null,
        });
      }
    }
    return entries;
  },
};

export { testCatalogue };

export function encounterRefFor(encounter: Encounter): DiagnosticOrderContextRef {
  return {
    patientId: encounter.patientId,
    doctorId: encounter.doctorId,
    doctorName: encounter.doctorName,
    hospitalId: encounter.hospitalId,
    hospitalName: encounter.hospitalName,
    departmentName: encounter.departmentName,
  };
}

export function parameterForTest(testId: string, key: string): CatalogParameter | undefined {
  return testById(testId)?.parameters.find((p) => p.key === key);
}

export { computeResultFlag };