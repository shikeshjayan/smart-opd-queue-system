export type PrescribedMedicineStatus = "prescribed" | "dispensed" | "discontinued" | "cancelled";

export type PrescribedMedicine = {
  id: string;
  medicineId: string;
  genericName: string;
  brandLabel?: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  route?: string;
  instructions?: string;
  status: PrescribedMedicineStatus;
  discontinuedReason?: string;
  dispensedAt?: string;
};

export type PrescriptionDispenseStatus =
  | "prescribed"
  | "sent_to_pharmacy"
  | "partially_dispensed"
  | "dispensed"
  | "cancelled";

export type Prescription = {
  id: string;
  encounterId: string;
  patientId: string;
  issuedAt: string;
  hospitalName: string;
  departmentName: string;
  doctorName: string;
  medicines: PrescribedMedicine[];
  instructions?: string;
  status: PrescriptionDispenseStatus;
  printedAt?: string;
};

export type MedicationRegimenEntry = {
  id: string;
  patientId: string;
  medicineId: string;
  genericName: string;
  brandLabel?: string;
  dosage: string;
  frequency: string;
  startedAt: string;
  status: "active" | "discontinued";
  discontinuedAt?: string;
  reason?: string;
};

export type PrescriptionDraftItem = {
  medicineId: string;
  brandLabel: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string;
};