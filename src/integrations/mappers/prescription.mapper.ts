import type { DataMapper } from "../types";

export const prescriptionMapper: DataMapper = {
  providerId: "health-record",
  entityType: "prescription",
  mappings: [
    { internal: "id", external: "prescription_id", transform: "none" },
    { internal: "patientId", external: "patient_identifier", transform: "none" },
    { internal: "doctorId", external: "practitioner_id", transform: "none" },
    { internal: "hospitalId", external: "facility_id", transform: "none" },
    { internal: "issuedAt", external: "prescribed_date", transform: "date_iso" },
    { internal: "medicines", external: "medication_items", transform: "none" },
  ],
};

export type ExternalPrescription = {
  prescription_id: string;
  patient_identifier: string;
  practitioner_id: string;
  facility_id: string;
  prescribed_date: string;
  medication_items: Array<{
    medicine_name: string;
    dosage: string;
    frequency: string;
    duration_days: number;
    route: string;
  }>;
};

export function mapPrescriptionToExternal(prescription: {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  issuedAt: string;
  medicines: Array<{
    medicineName: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    route: string;
  }>;
}): ExternalPrescription {
  return {
    prescription_id: prescription.id,
    patient_identifier: prescription.patientId,
    practitioner_id: prescription.doctorId,
    facility_id: prescription.hospitalId,
    prescribed_date: prescription.issuedAt,
    medication_items: prescription.medicines.map((m) => ({
      medicine_name: m.medicineName,
      dosage: m.dosage,
      frequency: m.frequency,
      duration_days: m.durationDays,
      route: m.route,
    })),
  };
}
