import type { DataMapper } from "../types";

export const encounterMapper: DataMapper = {
  providerId: "health-record",
  entityType: "encounter",
  mappings: [
    { internal: "id", external: "encounter_id", transform: "none" },
    { internal: "patientId", external: "patient_identifier", transform: "none" },
    { internal: "doctorId", external: "practitioner_id", transform: "none" },
    { internal: "hospitalId", external: "facility_id", transform: "none" },
    { internal: "departmentName", external: "department", transform: "none" },
    { internal: "date", external: "encounter_date", transform: "date_iso" },
    { internal: "status", external: "encounter_status", transform: "enum_map" },
  ],
};

export type ExternalEncounter = {
  encounter_id: string;
  patient_identifier: string;
  practitioner_id: string;
  facility_id: string;
  department: string;
  encounter_date: string;
  encounter_status: string;
};

export function mapEncounterToExternal(encounter: {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  departmentName: string;
  date: string;
  status: string;
}): ExternalEncounter {
  return {
    encounter_id: encounter.id,
    patient_identifier: encounter.patientId,
    practitioner_id: encounter.doctorId,
    facility_id: encounter.hospitalId,
    department: encounter.departmentName,
    encounter_date: encounter.date,
    encounter_status: encounter.status,
  };
}
