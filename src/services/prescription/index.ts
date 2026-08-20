import { getPatient } from "../data";
import { medicineById } from "../medicine";
import type { PrescribedMedicine, Prescription, PrescriptionDraftItem, MedicationRegimenEntry } from "./types";

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

function seedRegimen(): MedicationRegimenEntry[] {
  return [
    { id: "rxg_001", patientId: "P10294", medicineId: "med_metform", genericName: "Metformin", brandLabel: "Glycomet-GP", dosage: "500 mg", frequency: "1-0-1", startedAt: "2026-04-18", status: "active" },
    { id: "rxg_002", patientId: "P10294", medicineId: "med_amlod", genericName: "Amlodipine", brandLabel: "Amlong", dosage: "5 mg", frequency: "1-0-0", startedAt: "2026-01-12", status: "active" },
    { id: "rxg_003", patientId: "P10294", medicineId: "med_atorvast", genericName: "Atorvastatin", brandLabel: "Atorva", dosage: "10 mg", frequency: "0-1-0", startedAt: "2026-01-12", status: "active" },
    { id: "rxg_004", patientId: "P10294", medicineId: "med_aspirin", genericName: "Aspirin (Low dose)", brandLabel: "Ecosprin", dosage: "75 mg", frequency: "1-0-0", startedAt: "2026-01-12", status: "active" },
    { id: "rxg_005", patientId: "P10294", medicineId: "med_cetirizine", genericName: "Cetirizine", brandLabel: "Cetzine", dosage: "10 mg", frequency: "0-1-0", startedAt: "2025-12-04", status: "discontinued", discontinuedAt: "2026-01-12", reason: "Symptom resolved" },
    { id: "rxg_006", patientId: "P10421", medicineId: "med_panto", genericName: "Pantoprazole", brandLabel: "Pan-D", dosage: "40 mg", frequency: "1-0-0", startedAt: "2026-08-19", status: "active" },
  ];
}

function seedPrescriptions(): Prescription[] {
  return [
    {
      id: "RX20260819003",
      encounterId: "E20260819003",
      patientId: "P10421",
      issuedAt: "2026-08-19T10:08:00",
      hospitalName: "Government Hospital Ernakulam",
      departmentName: "Cardiology",
      doctorName: "Dr. Anil Kumar",
      status: "prescribed",
      medicines: [
        { id: "pmi_001", medicineId: "med_par", genericName: "Paracetamol", brandLabel: "Calpol", dosage: "650 mg", frequency: "1-1-1", durationDays: 3, route: "Oral", status: "prescribed" },
        { id: "pmi_002", medicineId: "med_panto", genericName: "Pantoprazole", brandLabel: "Pan-D", dosage: "40 mg", frequency: "1-0-0", durationDays: 14, route: "Oral before breakfast", status: "prescribed" },
      ],
      instructions: "Take Pantoprazole before breakfast.",
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

function today(): string {
  return new Date().toISOString().slice(0, 10);
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
      .filter((p) => p.patientId === patientId)
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  },

  async listAll(): Promise<Prescription[]> {
    await delay();
    ensureLoaded();
    return [...(prescriptions ?? [])].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  },

  async getById(prescriptionId: string): Promise<Prescription | undefined> {
    await delay();
    ensureLoaded();
    return (prescriptions ?? []).find((p) => p.id === prescriptionId);
  },

  async listRegimen(patientId: string): Promise<MedicationRegimenEntry[]> {
    await delay();
    ensureLoaded();
    return (regimen ?? [])
      .filter((r) => r.patientId === patientId)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  },

  async create(
    encounterId: string,
    doctorName: string,
    hospitalName: string,
    departmentName: string,
    patientId: string,
    items: PrescriptionDraftItem[],
    instructions?: string
  ): Promise<Prescription> {
    await delay();
    ensureLoaded();
    const meds: PrescribedMedicine[] = items.map((item) => {
      const med = medicineById(item.medicineId);
      return {
        id: nextId("pmi_"),
        medicineId: item.medicineId,
        genericName: med?.genericName ?? item.brandLabel,
        brandLabel: item.brandLabel || med?.brandNames[0],
        dosage: item.dosage,
        frequency: item.frequency,
        durationDays: item.durationDays,
        route: item.instructions ? "Oral" : med?.route,
        instructions: item.instructions,
        status: "prescribed" as const,
      };
    });
    const prescription: Prescription = {
      id: `RX${Date.now()}`,
      encounterId,
      patientId,
      issuedAt: new Date().toISOString(),
      hospitalName,
      departmentName,
      doctorName,
      medicines: meds,
      instructions,
      status: "prescribed",
    };
    prescriptions = [prescription, ...(prescriptions ?? [])];
    save(PRESCRIPTIONS_KEY, prescriptions);

    let added = false;
    const existing = regimen ?? [];
    const next = existing.map((r) => ({ ...r }));
    for (const item of items) {
      if (!next.some((r) => r.patientId === patientId && r.medicineId === item.medicineId && r.status === "active")) {
        next.unshift({
          id: nextId("rxg_"),
          patientId,
          medicineId: item.medicineId,
          genericName: medicineById(item.medicineId)?.genericName ?? item.brandLabel,
          brandLabel: item.brandLabel || medicineById(item.medicineId)?.brandNames[0],
          dosage: item.dosage,
          frequency: item.frequency,
          startedAt: today(),
          status: "active",
        });
        added = true;
      }
    }
    if (added) {
      regimen = next;
      save(REGIMEN_KEY, regimen);
    }
    return prescription;
  },

  async updateStatus(prescriptionId: string, status: Prescription["status"]): Promise<Prescription | undefined> {
    await delay();
    ensureLoaded();
    const list = prescriptions ?? [];
    const index = list.findIndex((p) => p.id === prescriptionId);
    if (index === -1) return undefined;
    list[index] = { ...list[index], status, printedAt: status === "dispensed" ? new Date().toISOString() : list[index].printedAt };
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