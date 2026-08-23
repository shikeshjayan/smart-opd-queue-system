import type {
  DoctorProfile,
  Encounter,
  OPD,
  OPDCounts,
  PatientSummary,
} from "@/types";
import { auditService } from "@/services/security";
import { getCurrentActor } from "@/features/security/utils/current-actor";
import { integrationService } from "@/integrations/service";
import {
  countQueueStatuses,
  createEncounterForToken,
  getDepartment,
  getDoctor,
  getEncounter,
  getHospital,
  getOpd,
  getPatient,
  listAllEncounters,
  listEncounters,
  updateEncounter,
} from "../data";

export type OPDSummary = {
  opd: OPD;
  counts: OPDCounts;
  doctorName: string;
  hospitalName: string;
  departmentName: string;
};

const delay = () => new Promise((resolve) => setTimeout(resolve, 300));

export const doctorService = {
  async getProfile(): Promise<DoctorProfile> {
    await delay();
    return getDoctor();
  },

  async getOpdSummary(): Promise<OPDSummary> {
    await delay();
    const doctor = getDoctor();
    const opd = getOpd(doctor.opdId);
    const department = opd ? getDepartment(opd.departmentId) : undefined;
    const hospital = department ? getHospital(department.hospitalId) : undefined;
    if (!opd) {
      throw new Error("Today's OPD not found");
    }
    return {
      opd,
      counts: countQueueStatuses(doctor.opdId),
      doctorName: doctor.name,
      hospitalName: hospital?.name ?? "",
      departmentName: department?.name ?? "",
    };
  },

  async getPatient(patientId: string): Promise<PatientSummary | undefined> {
    await delay();
    return getPatient(patientId);
  },

  async listPatientEncounters(patientId: string): Promise<Encounter[]> {
    await delay();
    return listEncounters(patientId);
  },

  async listRecentEncounters(): Promise<Encounter[]> {
    await delay();
    return listAllEncounters();
  },

  async getEncounter(id: string): Promise<Encounter | undefined> {
    await delay();
    return getEncounter(id);
  },

  async getOrCreateEncounter(tokenNumber: string): Promise<Encounter | undefined> {
    await delay();
    return createEncounterForToken(tokenNumber);
  },

  async saveEncounter(
    id: string,
    patch: Partial<Encounter>
  ): Promise<Encounter | undefined> {
    await delay();
    return updateEncounter(id, { ...patch, status: "in_progress" });
  },

  async completeEncounter(
    id: string,
    patch: Partial<Encounter>
  ): Promise<Encounter | undefined> {
    await delay();
    const result = updateEncounter(id, { ...patch, status: "completed" });
    if (result) {
      const actor = getCurrentActor();
      if (actor) {
        auditService.log({
          actorId: actor.id,
          actorName: actor.name,
          actorRole: actor.role,
          action: "ENCOUNTER_COMPLETED",
          resourceType: "Encounter",
          resourceId: id,
          hospitalId: result.hospitalId,
          districtId: actor.scope.districtId,
          result: "success",
        });
      }
      integrationService.enqueueEvent("encounter.sync", id, "health-record");
    }
    return result;
  },
};
