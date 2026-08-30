
import "server-only";
import {
  patientRepository,
  encounterRepository,
  allergyRepository,
  conditionRepository,
  vitalSignsRepository,
  consultationRepository,
} from "@/server/repositories/medical-records.repository";
import type { AccessContext } from "@/server/lib/access-context";
import type {
  Patient,
  Allergy,
  Condition,
  VitalSigns,
  Encounter,
  EncounterType,
} from "@/types";
import { canAccessPatientRecordFromHospital } from "@/server/lib/scope-access";

export type PatientSummaryDTO = {
  id: string;
  patientNumber: string;
  name: string;
  age: number;
  gender?: string;
  phone?: string;
  bloodGroup?: string;
  registeredHospitalId: string;
  knownInfo: Patient["knownInfo"];
};

function toAge(identity: Patient["identity"]): number {
  if (!identity.dateOfBirth) return 0;
  const dob = new Date(identity.dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

export class PatientService {
  async getSummary(patientId: string, ctx: AccessContext): Promise<PatientSummaryDTO> {
    const patient = await patientRepository.findById(patientId, ctx);
    if (!patient) throw new Error("Patient not found");

    return {
      id: patient.id,
      patientNumber: patient.patientNumber,
      name: patient.identity.name,
      age: toAge(patient.identity),
      gender: patient.identity.gender,
      phone: patient.contact.mobile,
      bloodGroup: patient.bloodGroup,
      registeredHospitalId: patient.registeredHospitalId,
      knownInfo: patient.knownInfo,
    };
  }

  async getProfile(patientId: string, ctx: AccessContext): Promise<Patient> {
    const patient = await patientRepository.findById(patientId, ctx);
    if (!patient) throw new Error("Patient not found");
    return patient;
  }

  async search(query: string, ctx: AccessContext): Promise<Patient[]> {
    const results = await patientRepository.searchPatients(query, ctx);
    return results.map((p) => ({
      ...p,
      identity: p.identity,
      contact: p.contact,
    }));
  }

  async register(
    input: {
      identity: Patient["identity"];
      contact: Patient["contact"];
      address?: Patient["address"];
      emergencyContact?: Patient["emergencyContact"];
      bloodGroup?: string;
    },
    hospitalId: string,
    ctx: AccessContext
  ): Promise<Patient> {
    return patientRepository.create({ ...input, registeredHospitalId: hospitalId }, ctx);
  }

  async lookupByPatientNumber(patientNumber: string, ctx: AccessContext): Promise<Patient | null> {
    return patientRepository.findByPatientNumber(patientNumber, ctx);
  }
}

export const patientService = new PatientService();

export class EncounterService {
  async listByPatient(patientId: string, ctx: AccessContext): Promise<Encounter[]> {
    const encounters = await encounterRepository.findByPatient(patientId, ctx);
    // Cross-hospital: filter to records the requester may see.
    return encounters.filter((e) => canAccessPatientRecordFromHospital(ctx, e.hospitalId));
  }

  async getById(encounterId: string, ctx: AccessContext): Promise<Encounter> {
    const encounter = await encounterRepository.findById(encounterId, ctx);
    if (!encounter) throw new Error("Encounter not found");
    return encounter;
  }

  async start(input: {
    patientId: string;
    type: EncounterType;
    departmentId?: string;
    doctorId?: string;
    appointmentId?: string;
    opdSessionId?: string;
    opdId?: string;
    tokenId?: string;
    tokenNumber?: string;
    hospitalName?: string;
    departmentName?: string;
    doctorName?: string;
  }, hospitalId: string, ctx: AccessContext): Promise<Encounter> {
    return encounterRepository.create({ ...input, hospitalId }, ctx);
  }

  async complete(encounterId: string, ctx: AccessContext): Promise<Encounter> {
    const updated = await encounterRepository.updateStatus(encounterId, "completed", ctx);
    if (!updated) throw new Error("Encounter not found");
    return updated;
  }

  async cancel(encounterId: string, ctx: AccessContext): Promise<Encounter> {
    const updated = await encounterRepository.updateStatus(encounterId, "cancelled", ctx);
    if (!updated) throw new Error("Encounter not found");
    return updated;
  }
}

export const encounterService = new EncounterService();

export class ClinicalService {
  async getAllergies(patientId: string, ctx: AccessContext): Promise<Allergy[]> {
    return allergyRepository.findByPatient(patientId, ctx);
  }

  async addAllergy(
    patientId: string,
    input: { substance: string; reaction?: string; severity?: Allergy["severity"] },
    ctx: AccessContext
  ): Promise<Allergy> {
    const existing = await allergyRepository.findBySubstance(patientId, input.substance, ctx);
    if (existing) return existing; // idempotent — dedupe by substance
    return allergyRepository.create({ patientId, recordedBy: ctx.userId, ...input }, ctx);
  }

  async updateAllergy(
    patientId: string,
    allergyId: string,
    patch: Partial<Allergy>,
    ctx: AccessContext
  ): Promise<Allergy | null> {
    return allergyRepository.update(patientId, allergyId, patch, ctx);
  }

  async removeAllergy(patientId: string, allergyId: string, ctx: AccessContext): Promise<void> {
    await allergyRepository.remove(patientId, allergyId, ctx);
  }

  async getConditions(patientId: string, ctx: AccessContext): Promise<Condition[]> {
    return conditionRepository.findByPatient(patientId, ctx);
  }

  async addCondition(
    patientId: string,
    input: { name: string; status?: Condition["status"]; diagnosedAt?: string },
    ctx: AccessContext
  ): Promise<Condition> {
    return conditionRepository.create({ patientId, recordedBy: ctx.userId, ...input }, ctx);
  }

  async updateConditionStatus(
    patientId: string,
    conditionId: string,
    status: Condition["status"],
    ctx: AccessContext
  ): Promise<Condition | null> {
    return conditionRepository.updateStatus(patientId, conditionId, status, ctx);
  }

  async updateCondition(
    patientId: string,
    conditionId: string,
    patch: Partial<Condition>,
    ctx: AccessContext
  ): Promise<Condition | null> {
    return conditionRepository.update(patientId, conditionId, patch, ctx);
  }

  async getVitalSigns(patientId: string, ctx: AccessContext): Promise<VitalSigns[]> {
    return vitalSignsRepository.findByPatient(patientId, ctx, 50);
  }

  async getLatestVitals(patientId: string, ctx: AccessContext): Promise<VitalSigns | null> {
    return vitalSignsRepository.findLatest(patientId, ctx);
  }

  async recordVitals(
    patientId: string,
    input: {
      encounterId?: string;
      temperature?: number;
      heartRate?: number;
      respiratoryRate?: number;
      systolicBP?: number;
      diastolicBP?: number;
      oxygenSaturation?: number;
      heightCm?: number;
      weightKg?: number;
    },
    ctx: AccessContext
  ): Promise<VitalSigns> {
    return vitalSignsRepository.create({ patientId, recordedBy: ctx.userId, ...input }, ctx);
  }

  async getConsultation(encounterId: string, ctx: AccessContext): Promise<unknown | null> {
    return consultationRepository.findByEncounter(encounterId, ctx);
  }
}

export const clinicalService = new ClinicalService();