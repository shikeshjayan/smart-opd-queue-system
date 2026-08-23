import {
  getDoctorProfile,
  getOrCreateEncounterForToken,
  listDoctorEncounters,
  updateEncounterStatus,
  getEncounterById,
  getConsultationContextForEncounter,
  getCurrentSessionAction,
} from "@/server/actions/doctor";
import { getPatient, listEncounters } from "@/server/actions/patients";
import {
  getOpdById,
  getQueueCounts,
  listQueue,
  completeTokenEntry,
} from "@/server/actions/queue";
import { getDepartment, getHospital } from "@/server/actions/hospitals";
import type { Encounter } from "@/types";
import type { ConsultationContext, DoctorDashboard } from "../types/doctor.types";

export const doctorMockApi = {
  async getProfile() {
    const profile = await getDoctorProfile();
    if (!profile) throw new Error("Doctor profile not found");
    return profile;
  },

  async getDashboard(): Promise<DoctorDashboard> {
    const profile = await getDoctorProfile();
    if (!profile) throw new Error("Doctor profile not found");

    const [opd, counts, queueEntries] = await Promise.all([
      getOpdById(profile.opdId),
      getQueueCounts(profile.opdId),
      listQueue(profile.opdId),
    ]);

    if (!opd) throw new Error("Today's OPD not found");

    const department = await getDepartment((opd as any).departmentId);
    const hospital = await getHospital(department?.hospitalId ?? "");

    const queue = queueEntries as any[];
    const currentEntry =
      queue.find((q: any) => q.status === "in_consultation") ??
      queue.find((q: any) => q.status === "called") ??
      null;

    let current: DoctorDashboard["current"] = null;
    if (currentEntry?.patientId) {
      const [patient, encounters] = await Promise.all([
        getPatient(currentEntry.patientId),
        listEncounters(currentEntry.patientId),
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
      opd: opd as any,
      counts,
      current,
      waitingPreview: queue.filter((q: any) => q.status === "waiting").slice(0, 5),
    };
  },

  async getOpdSummary() {
    const profile = await getDoctorProfile();
    if (!profile) throw new Error("Doctor profile not found");
    const [opd, counts] = await Promise.all([
      getOpdById(profile.opdId),
      getQueueCounts(profile.opdId),
    ]);
    const department = opd ? await getDepartment((opd as any).departmentId) : null;
    const hospital = department ? await getHospital(department.hospitalId) : null;
    return {
      opd: opd as any,
      counts,
      doctorName: profile.name,
      hospitalName: hospital?.name ?? "",
      departmentName: department?.name ?? "",
    };
  },

  async getPatient(patientId: string) {
    const patient = await getPatient(patientId);
    const encounters = await listEncounters(patientId);
    return { patient, encounters };
  },

  async getEncounter(id: string): Promise<Encounter | undefined> {
    const encounter = await getEncounterById(id);
    return encounter ?? undefined;
  },

  async getOrCreateEncounter(tokenNumber: string): Promise<Encounter | undefined> {
    const session = await getCurrentSessionAction();
    if (!session) return undefined;
    const encounter = await getOrCreateEncounterForToken(tokenNumber, session.id);
    return encounter ?? undefined;
  },

  async getConsultationContext(encounterId: string): Promise<ConsultationContext | null> {
    const result = await getConsultationContextForEncounter(encounterId);
    if (!result) return null;
    return {
      encounter: result.encounter,
      patient: result.patient as ConsultationContext["patient"],
      doctor: result.doctor,
    };
  },

  async saveDraft(encounterId: string, patch: Partial<Encounter>) {
    await updateEncounterStatus(encounterId, { ...patch, status: "in_progress" });
    return getEncounterById(encounterId);
  },

  async completeEncounter(encounterId: string, patch: Partial<Encounter>) {
    await updateEncounterStatus(encounterId, { ...patch, status: "completed", completedAt: new Date().toISOString() });
    return getEncounterById(encounterId);
  },

  async completeConsultation(tokenNumber: string) {
    return completeTokenEntry(tokenNumber);
  },

  async getHistory() {
    return listDoctorEncounters("doc_001", 50);
  },
};
