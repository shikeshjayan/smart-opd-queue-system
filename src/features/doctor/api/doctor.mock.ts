import { doctorService } from "@/services/doctor";
import { queueService } from "@/services/queue";
import type { Encounter } from "@/types";
import type { ConsultationContext, DoctorDashboard } from "../types/doctor.types";

export const doctorMockApi = {
  async getProfile() {
    return doctorService.getProfile();
  },

  async getDashboard(): Promise<DoctorDashboard> {
    const [profile, summary] = await Promise.all([
      doctorService.getProfile(),
      doctorService.getOpdSummary(),
    ]);
    const queue = await queueService.list(profile.opdId);

    const currentEntry =
      queue.find((q) => q.status === "in_consultation") ??
      queue.find((q) => q.status === "called") ??
      null;

    let current: DoctorDashboard["current"] = null;
    if (currentEntry && currentEntry.patientId) {
      const [patient, encounters] = await Promise.all([
        doctorService.getPatient(currentEntry.patientId),
        doctorService.listPatientEncounters(currentEntry.patientId),
      ]);
      const activeEncounter =
        encounters.find((e) => e.tokenNumber === currentEntry.tokenNumber) ?? encounters[0];
      current = {
        entry: currentEntry,
        patient: patient ?? null,
        encounterId: activeEncounter?.id ?? "",
      };
    }

    return {
      doctor: profile,
      opd: summary.opd,
      counts: summary.counts,
      current,
      waitingPreview: queue.filter((q) => q.status === "waiting").slice(0, 5),
    };
  },

  async getOpdSummary() {
    return doctorService.getOpdSummary();
  },

  async getPatient(patientId: string) {
    const patient = await doctorService.getPatient(patientId);
    const encounters = await doctorService.listPatientEncounters(patientId);
    return { patient, encounters };
  },

  async getEncounter(id: string): Promise<Encounter | undefined> {
    return doctorService.getEncounter(id);
  },

  async getOrCreateEncounter(tokenNumber: string): Promise<Encounter | undefined> {
    return doctorService.getOrCreateEncounter(tokenNumber);
  },

  async getConsultationContext(encounterId: string): Promise<ConsultationContext | null> {
    const [encounter, doctor] = await Promise.all([
      doctorService.getEncounter(encounterId),
      doctorService.getProfile(),
    ]);
    if (!encounter) return null;
    const patient = await doctorService.getPatient(encounter.patientId);
    return { encounter, patient: patient ?? null, doctor };
  },

  async saveDraft(encounterId: string, patch: Partial<Encounter>) {
    return doctorService.saveEncounter(encounterId, patch);
  },

  async completeEncounter(encounterId: string, patch: Partial<Encounter>) {
    return doctorService.completeEncounter(encounterId, patch);
  },

  async completeConsultation(tokenNumber: string) {
    return queueService.complete(tokenNumber);
  },

  async getHistory() {
    return doctorService.listRecentEncounters();
  },
};
