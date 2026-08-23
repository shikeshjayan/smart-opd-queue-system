import { getPatient } from "../data";
import { medicineById } from "../medicine";
import { auditService } from "@/services/security";
import { getCurrentActor } from "@/features/security/utils/current-actor";
import {
  durationToDays,
} from "./types";
import type {
  MedicationRegimenEntry,
  PrescribedMedicine,
  Prescription,
  PrescriptionContextRef,
  PrescriptionDraftItem,
} from "./types";

const delay = () => new Promise((resolve) => setTimeout(resolve, 300));

const PRESCRIPTIONS_KEY = "smart-health.prescriptions";
const REGIMEN_KEY = "smart-health.medication-regimen";

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

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function seedRegimen(): MedicationRegimenEntry[] {
  return [
    { id: "rxg_001", patientId: "P10294", medicineId: "med_metform", genericName: "Metformin", brandLabel: "Glycomet-GP", dosage: "500 mg", frequency: "1-0-1", startedAt: "2026-04-18", durationDays: 90, expectedEndDate: "2026-07-17", status: "completed" },
    { id: "rxg_002", patientId: "P10294", medicineId: "med_amlod", genericName: "Amlodipine", brandLabel: "Amlong", dosage: "5 mg", frequency: "1-0-0", startedAt: "2026-01-12", status: "active" },
    { id: "rxg_003", patientId: "P10294", medicineId: "med_atorvast", genericName: "Atorvastatin", brandLabel: "Atorva", dosage: "10 mg", frequency: "0-1-0", startedAt: "2026-01-12", status: "active" },
    { id: "rxg_004", patientId: "P10294", medicineId: "med_aspirin", genericName: "Aspirin (Low dose)", brandLabel: "Ecosprin", dosage: "75 mg", frequency: "1-0-0", startedAt: "2026-01-12", status: "active" },
    { id: "rxg_005", patientId: "P10294", medicineId: "med_cetirizine", genericName: "Cetirizine", brandLabel: "Cetzine", dosage: "10 mg", frequency: "0-1-0", startedAt: "2025-12-04", status: "discontinued", discontinuedAt: "2026-01-12", reason: "Symptom resolved" },
    { id: "rxg_006", patientId: "P10421", medicineId: "med_panto", genericName: "Pantoprazole", brandLabel: "Pan-D", dosage: "40 mg", frequency: "1-0-0", startedAt: "2026-08-19", durationDays: 14, expectedEndDate: "2026-09-02", status: "active" },
  ];
}

function seedMedicines(items: Array<Omit<PrescribedMedicine, "durationDays">>): PrescribedMedicine[] {
  return items.map((item) => ({ ...item, durationDays: durationToDays(item.duration) }));
}

function seedPrescriptions(): Prescription[] {
  return [
    {
      id: "RX20260819003",
      encounterId: "E20260819003",
      patientId: "P10421",
      doctorId: "doc_001",
      hospitalId: "ernakulam-gh",
      issuedAt: "2026-08-19T10:08:00",
      createdAt: "2026-08-19T10:08:00",
      finalizedAt: "2026-08-19T10:08:00",
      hospitalName: "Government Hospital Ernakulam",
      departmentName: "Cardiology",
      doctorName: "Dr. Anil Kumar",
      workflowStatus: "finalized",
      status: "prescribed",
      medicines: seedMedicines([
        {
          id: "pmi_001",
          medicineId: "med_par",
          medicineName: "Paracetamol",
          genericName: "Paracetamol",
          brandLabel: "Calpol 650",
          dosage: "650 mg",
          frequency: "1-1-1",
          duration: { value: 3, unit: "days" },
          route: "Oral",
          status: "prescribed",
        },
        {
          id: "pmi_002",
          medicineId: "med_panto",
          medicineName: "Pantoprazole",
          genericName: "Pantoprazole",
          brandLabel: "Pan-D",
          dosage: "40 mg",
          frequency: "1-0-0",
          duration: { value: 14, unit: "days" },
          route: "Oral",
          instructions: "Before breakfast",
          status: "prescribed",
        },
      ]),
      instructions: "Take Pantoprazole before breakfast.",
    },
    {
      id: "RX20260819002",
      encounterId: "E20260819002",
      patientId: "P10294",
      doctorId: "doc_001",
      hospitalId: "ernakulam-gh",
      issuedAt: "2026-08-18T11:20:00",
      createdAt: "2026-08-18T11:20:00",
      finalizedAt: "2026-08-18T11:20:00",
      hospitalName: "Government Hospital Ernakulam",
      departmentName: "Cardiology",
      doctorName: "Dr. Anil Kumar",
      workflowStatus: "finalized",
      status: "dispensed",
      printedAt: "2026-08-18T12:05:00",
      medicines: seedMedicines([
        {
          id: "pmi_003",
          medicineId: "med_amlod",
          medicineName: "Amlodipine",
          genericName: "Amlodipine",
          brandLabel: "Amlong",
          dosage: "5 mg",
          frequency: "1-0-0",
          duration: { value: 30, unit: "days" },
          route: "Oral",
          status: "dispensed",
          dispensedAt: "2026-08-18T12:05:00",
        },
        {
          id: "pmi_004",
          medicineId: "med_atorvast",
          medicineName: "Atorvastatin",
          genericName: "Atorvastatin",
          brandLabel: "Atorva",
          dosage: "10 mg",
          frequency: "0-1-0",
          duration: { value: 30, unit: "days" },
          route: "Oral",
          instructions: "Take at night",
          status: "dispensed",
          dispensedAt: "2026-08-18T12:05:00",
        },
      ]),
      instructions: "Take at night.",
    },
    {
      id: "RX20260819001",
      encounterId: "E20260819001",
      patientId: "P10294",
      doctorId: "doc_001",
      hospitalId: "ernakulam-gh",
      issuedAt: "2026-08-15T09:45:00",
      createdAt: "2026-08-15T09:45:00",
      finalizedAt: "2026-08-15T09:45:00",
      hospitalName: "Government Hospital Ernakulam",
      departmentName: "General Medicine",
      doctorName: "Dr. Anil Kumar",
      workflowStatus: "finalized",
      status: "dispensed",
      printedAt: "2026-08-15T10:10:00",
      medicines: seedMedicines([
        {
          id: "pmi_005",
          medicineId: "med_panto",
          medicineName: "Pantoprazole",
          genericName: "Pantoprazole",
          brandLabel: "Pan-D",
          dosage: "40 mg",
          frequency: "1-0-0",
          duration: { value: 14, unit: "days" },
          route: "Oral",
          instructions: "Before breakfast",
          status: "dispensed",
          dispensedAt: "2026-08-15T10:10:00",
        },
      ]),
    },
  ];
}

let prescriptions: Prescription[] | null = null;
let regimen: MedicationRegimenEntry[] | null = null;

function ensureLoaded(): void {
  if (prescriptions === null) prescriptions = load(PRESCRIPTIONS_KEY, seedPrescriptions);
  if (regimen === null) regimen = load(REGIMEN_KEY, seedRegimen);
}

function nextId(prefix: string): string {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function isDraft(prescription: Prescription): boolean {
  return prescription.workflowStatus === "draft";
}

function deriveRegimenStatus(entry: MedicationRegimenEntry): MedicationRegimenEntry {
  if (entry.status !== "active" || !entry.expectedEndDate) return entry;
  if (today() > entry.expectedEndDate) {
    return { ...entry, status: "completed" as const };
  }
  return entry;
}

function buildMedicineFromItem(item: PrescriptionDraftItem, id: string): PrescribedMedicine {
  const catalog = medicineById(item.medicineId);
  return {
    id,
    medicineId: item.medicineId,
    medicineName: item.medicineName,
    genericName: item.genericName ?? catalog?.genericName ?? item.medicineName,
    brandLabel: item.brandLabel || catalog?.brandNames[0],
    dosage: item.dosage,
    frequency: item.frequency,
    duration: item.duration,
    durationDays: durationToDays(item.duration),
    route: item.route || "Oral",
    instructions: item.instructions,
    status: "prescribed" as const,
  };
}

function makePrescription(
  encounterId: string,
  ref: PrescriptionContextRef,
  items: PrescriptionDraftItem[],
  instructions: string | undefined,
  workflowStatus: Prescription["workflowStatus"]
): Prescription {
  const now = new Date().toISOString();
  return {
    id: `RX${Date.now()}`,
    encounterId,
    patientId: ref.patientId,
    doctorId: ref.doctorId,
    hospitalId: ref.hospitalId,
    issuedAt: now,
    createdAt: now,
    finalizedAt: workflowStatus === "finalized" ? now : undefined,
    hospitalName: ref.hospitalName,
    departmentName: ref.departmentName,
    doctorName: ref.doctorName,
    medicines: items.map((item) => buildMedicineFromItem(item, nextId("pmi_"))),
    instructions,
    workflowStatus,
    status: "prescribed",
  };
}

function syncRegimen(prescription: Prescription): void {
  const current = (regimen ?? []).map((r) => ({ ...r }));
  let changed = false;
  for (const med of prescription.medicines) {
    const exists = current.some(
      (r) =>
        r.patientId === prescription.patientId &&
        r.medicineId === med.medicineId &&
        r.status === "active"
    );
    if (exists) continue;
    const started = today();
    const durationDays = med.durationDays > 0 ? med.durationDays : undefined;
    current.unshift({
      id: nextId("rxg_"),
      patientId: prescription.patientId,
      medicineId: med.medicineId,
      genericName: med.genericName,
      brandLabel: med.brandLabel,
      dosage: med.dosage,
      frequency: med.frequency,
      startedAt: started,
      durationDays,
      expectedEndDate: durationDays ? addDays(started, durationDays) : undefined,
      status: "active",
    });
    changed = true;
  }
  if (changed) {
    regimen = current;
    save(REGIMEN_KEY, regimen);
  }
}

export const prescriptionService = {
  async listForEncounter(encounterId: string): Promise<Prescription[]> {
    await delay();
    ensureLoaded();
    return (prescriptions ?? []).filter((p) => p.encounterId === encounterId);
  },

  async listForPatient(patientId: string): Promise<Prescription[]> {
    await delay();
    ensureLoaded();
    return (prescriptions ?? [])
      .filter((p) => p.patientId === patientId && !isDraft(p))
      .sort((a, b) => (b.finalizedAt ?? b.createdAt).localeCompare(a.finalizedAt ?? a.createdAt));
  },

  async listAll(): Promise<Prescription[]> {
    await delay();
    ensureLoaded();
    return [...(prescriptions ?? [])]
      .filter((p) => !isDraft(p))
      .sort((a, b) => (b.finalizedAt ?? b.createdAt).localeCompare(a.finalizedAt ?? a.createdAt));
  },

  async getById(prescriptionId: string): Promise<Prescription | undefined> {
    await delay();
    ensureLoaded();
    return (prescriptions ?? []).find((p) => p.id === prescriptionId);
  },

  async getDraftForEncounter(encounterId: string): Promise<Prescription | undefined> {
    await delay();
    ensureLoaded();
    return (prescriptions ?? []).find(
      (p) => p.encounterId === encounterId && p.workflowStatus === "draft"
    );
  },

  async listRegimen(patientId: string): Promise<MedicationRegimenEntry[]> {
    await delay();
    ensureLoaded();
    return (regimen ?? [])
      .filter((r) => r.patientId === patientId)
      .map(deriveRegimenStatus)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  },

  async createDraft(
    encounterId: string,
    ref: PrescriptionContextRef,
    items: PrescriptionDraftItem[],
    instructions?: string
  ): Promise<Prescription> {
    await delay();
    ensureLoaded();
    const prescription = makePrescription(encounterId, ref, items, instructions, "draft");
    prescriptions = [prescription, ...(prescriptions ?? [])];
    save(PRESCRIPTIONS_KEY, prescriptions);
    return prescription;
  },

  async updateDraft(
    prescriptionId: string,
    items: PrescriptionDraftItem[],
    instructions?: string
  ): Promise<Prescription | undefined> {
    await delay();
    ensureLoaded();
    const list = prescriptions ?? [];
    const index = list.findIndex((p) => p.id === prescriptionId);
    if (index === -1 || list[index].workflowStatus !== "draft") return undefined;
    list[index] = {
      ...list[index],
      medicines: items.map((item) => buildMedicineFromItem(item, nextId("pmi_"))),
      instructions,
      issuedAt: new Date().toISOString(),
    };
    prescriptions = list;
    save(PRESCRIPTIONS_KEY, prescriptions);
    return list[index];
  },

  async finalize(prescriptionId: string): Promise<Prescription | undefined> {
    await delay();
    ensureLoaded();
    const list = prescriptions ?? [];
    const index = list.findIndex((p) => p.id === prescriptionId);
    if (index === -1 || list[index].workflowStatus !== "draft") return undefined;
    const now = new Date().toISOString();
    list[index] = {
      ...list[index],
      workflowStatus: "finalized",
      finalizedAt: now,
    };
    prescriptions = list;
    save(PRESCRIPTIONS_KEY, prescriptions);
    syncRegimen(list[index]);
    const actor = getCurrentActor();
    if (actor) {
      auditService.log({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "PRESCRIPTION_FINALIZED",
        resourceType: "Prescription",
        resourceId: prescriptionId,
        hospitalId: actor.scope.hospitalId,
        districtId: actor.scope.districtId,
        result: "success",
      });
    }
    return list[index];
  },

  async cancel(prescriptionId: string, reason?: string): Promise<Prescription | undefined> {
    await delay();
    ensureLoaded();
    const list = prescriptions ?? [];
    const index = list.findIndex((p) => p.id === prescriptionId);
    if (index === -1) return undefined;
    list[index] = { ...list[index], workflowStatus: "cancelled", cancelledReason: reason };
    prescriptions = list;
    save(PRESCRIPTIONS_KEY, prescriptions);
    return list[index];
  },

  async create(
    encounterId: string,
    ref: PrescriptionContextRef,
    items: PrescriptionDraftItem[],
    instructions?: string
  ): Promise<Prescription> {
    const draft = await this.createDraft(encounterId, ref, items, instructions);
    const finalized = await this.finalize(draft.id);
    return finalized ?? draft;
  },

  async updateStatus(prescriptionId: string, status: Prescription["status"]): Promise<Prescription | undefined> {
    await delay();
    ensureLoaded();
    const list = prescriptions ?? [];
    const index = list.findIndex((p) => p.id === prescriptionId);
    if (index === -1 || list[index].workflowStatus !== "finalized") return undefined;
    list[index] = {
      ...list[index],
      status,
      printedAt: status === "dispensed" ? new Date().toISOString() : list[index].printedAt,
    };
    prescriptions = list;
    save(PRESCRIPTIONS_KEY, prescriptions);
    return list[index];
  },

  async discontinueMedicine(
    prescriptionId: string,
    medicineId: string,
    reason: string
  ): Promise<Prescription | undefined> {
    await delay();
    ensureLoaded();
    const list = prescriptions ?? [];
    const index = list.findIndex((p) => p.id === prescriptionId);
    if (index === -1) return undefined;
    const prescription = list[index];
    const meds = prescription.medicines.map((m) =>
      m.id === medicineId ? { ...m, status: "discontinued" as const, discontinuedReason: reason } : m
    );
    list[index] = { ...prescription, medicines: meds };
    prescriptions = list;
    save(PRESCRIPTIONS_KEY, prescriptions);
    return list[index];
  },

  async discontinueRegimen(regimenId: string, reason: string): Promise<MedicationRegimenEntry[]> {
    await delay();
    ensureLoaded();
    const next = (regimen ?? []).map((r) =>
      r.id === regimenId
        ? { ...r, status: "discontinued" as const, discontinuedAt: new Date().toISOString(), reason }
        : r
    );
    regimen = next;
    save(REGIMEN_KEY, regimen);
    return next.filter((r) => r.patientId === (next.find((x) => x.id === regimenId)?.patientId ?? ""));
  },
};

export function patientNameFor(patientId: string): string {
  return getPatient(patientId)?.name ?? "Patient";
}