import type { Encounter } from "@/types";
import { getEncounter, getPatient, listEncounters, updateEncounter } from "../data";
import type { ConsultationContext, ConsultationRecord, ConsultationSections } from "./types";
import { emptyRecord } from "./types";

const delay = () => new Promise((resolve) => setTimeout(resolve, 300));

const STORAGE_KEY = "smart-health.consultation-records";

function loadPersisted(): Record<string, ConsultationRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ConsultationRecord>) : {};
  } catch {
    return {};
  }
}

const records: Record<string, ConsultationRecord> = loadPersisted();

const seedSections: Record<string, ConsultationSections> = {
  E20260819003: {
    chiefComplaint: { text: "Chest discomfort since morning", duration: "Since morning ~2 hours" },
    symptoms: ["Chest pain", "Breathlessness"],
    vitals: {
      bpSystolic: 138,
      bpDiastolic: 86,
      pulse: 78,
      temperature: 98.6,
      respiratoryRate: 18,
      spo2: 98,
      heightCm: 168,
      weightKg: 74,
      bmi: 26.2,
    },
    examination: {
      general: "Conscious, oriented. Mild pallor.",
      system: "Cardiovascular: regular rhythm, no murmurs. Respiratory: clear.",
      other: "ECG: no acute ischaemic changes.",
    },
    diagnoses: [{ code: "I20.9", name: "Suspected stable angina", type: "primary" }],
    treatmentPlan: "Start antiplatelet and statin therapy. Repeat lipid profile. Cardiology follow-up in 2 weeks.",
    followUp: { decision: "return", date: "2026-09-02", notes: "Review after 2 weeks with repeat lipid profile." },
  },
  E20260815001: {
    chiefComplaint: { text: "Routine annual health review", duration: "Ongoing follow-up" },
    symptoms: ["Other"],
    vitals: { bpSystolic: 135, bpDiastolic: 85, pulse: 80, temperature: 98.4, respiratoryRate: 17, spo2: 99 },
    examination: {
      general: "Well built. Asymptomatic.",
      system: "All systems within normal limits.",
      other: "",
    },
    diagnoses: [{ code: "I10", name: "Hypertension unchanged", type: "primary" }],
    treatmentPlan: "Continue current medications and lifestyle measures.",
    followUp: { decision: "review", notes: "Routine cardiac review in 6 months." },
  },
};

for (const [encounterId, sections] of Object.entries(seedSections)) {
  if (!records[encounterId]) {
    records[encounterId] = { ...sections, encounterId, updatedAt: new Date().toISOString() };
  }
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // storage unavailable — keep in-memory record
  }
}

export function recordForEncounter(encounterId: string): ConsultationRecord {
  return records[encounterId] ?? emptyRecord(encounterId);
}

function startIfOpen(encounter: Encounter): Encounter {
  if (encounter.status !== "open") return encounter;
  return (
    updateEncounter(encounter.id, { status: "in_progress", startedAt: new Date().toISOString() }) ??
    encounter
  );
}

export const consultationService = {
  async getContext(encounterId: string): Promise<ConsultationContext | null> {
    await delay();
    const encounter = getEncounter(encounterId);
    if (!encounter) return null;
    const started = startIfOpen(encounter);
    const patient = getPatient(started.patientId) ?? null;
    return { encounter: started, patient, record: recordForEncounter(started.id) };
  },

  async getOrCreateForPatient(patientId: string): Promise<ConsultationContext | null> {
    await delay();
    const encounters = listEncounters(patientId);
    const active = encounters.find((e) => e.status === "open" || e.status === "in_progress");
    if (!active) return null;
    const started = startIfOpen(active);
    const patient = getPatient(patientId) ?? null;
    return { encounter: started, patient, record: recordForEncounter(started.id) };
  },

  async saveDraft(encounterId: string, sections: ConsultationSections): Promise<ConsultationRecord | undefined> {
    await delay();
    const encounter = getEncounter(encounterId);
    if (!encounter) return undefined;
    let record = records[encounterId] ?? emptyRecord(encounterId);
    record = { ...record, ...sections, encounterId, updatedAt: new Date().toISOString() };
    records[encounterId] = record;
    persist();
    return record;
  },

  async complete(encounterId: string): Promise<Encounter | undefined> {
    await delay();
    return updateEncounter(encounterId, {
      status: "completed",
      completedAt: new Date().toISOString(),
    });
  },
};

export type { ConsultationContext, ConsultationRecord, ConsultationSections } from "./types";