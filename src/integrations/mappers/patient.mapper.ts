import type { DataMapper } from "../types";

export const patientMapper: DataMapper = {
  providerId: "identity",
  entityType: "patient",
  mappings: [
    { internal: "id", external: "patient_identifier", transform: "none" },
    { internal: "name", external: "full_name", transform: "none" },
    { internal: "age", external: "age_years", transform: "none" },
    { internal: "gender", external: "sex", transform: "enum_map" },
    { internal: "phone", external: "contact_number", transform: "none" },
    { internal: "bloodGroup", external: "blood_group", transform: "none" },
    { internal: "registeredHospitalId", external: "facility_id", transform: "none" },
  ],
};

export type ExternalPatient = {
  patient_identifier: string;
  full_name: string;
  age_years: number;
  sex: string;
  contact_number: string;
  blood_group?: string;
  facility_id: string;
  identity_refs?: Array<{ provider: string; external_id: string }>;
};

export function mapPatientToExternal(patient: {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  bloodGroup?: string;
  registeredHospitalId: string;
}): ExternalPatient {
  return {
    patient_identifier: patient.id,
    full_name: patient.name,
    age_years: patient.age,
    sex: patient.gender,
    contact_number: patient.phone,
    blood_group: patient.bloodGroup,
    facility_id: patient.registeredHospitalId,
  };
}

export function mapPatientFromExternal(external: ExternalPatient): {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  bloodGroup?: string;
  registeredHospitalId: string;
} {
  return {
    id: external.patient_identifier,
    name: external.full_name,
    age: external.age_years,
    gender: external.sex,
    phone: external.contact_number,
    bloodGroup: external.blood_group,
    registeredHospitalId: external.facility_id,
  };
}
