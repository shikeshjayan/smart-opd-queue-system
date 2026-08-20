export type DurationUnit = "days" | "weeks" | "months";

export type Duration = {
  value: number;
  unit: DurationUnit;
};

export type PrescribedMedicineStatus = "prescribed" | "dispensed" | "discontinued" | "cancelled";

export type PrescribedMedicine = {
  id: string;
  medicineId: string;
  medicineName: string;
  genericName: string;
  brandLabel?: string;
  dosage: string;
  frequency: string;
  duration: Duration;
  durationDays: number;
  route: string;
  instructions?: string;
  status: PrescribedMedicineStatus;
  discontinuedReason?: string;
  dispensedAt?: string;
};

export type PrescriptionWorkflowStatus = "draft" | "finalized" | "cancelled";

export type PrescriptionDispenseStatus =
  | "prescribed"
  | "sent_to_pharmacy"
  | "partially_dispensed"
  | "dispensed";

export type PrescriptionContextRef = {
  patientId: string;
  doctorId: string;
  hospitalId: string;
  doctorName: string;
  hospitalName: string;
  departmentName: string;
};

export type Prescription = {
  id: string;
  encounterId: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  issuedAt: string;
  createdAt: string;
  finalizedAt?: string;
  hospitalName: string;
  departmentName: string;
  doctorName: string;
  medicines: PrescribedMedicine[];
  instructions?: string;
  workflowStatus: PrescriptionWorkflowStatus;
  status: PrescriptionDispenseStatus;
  printedAt?: string;
  cancelledReason?: string;
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
  durationDays?: number;
  expectedEndDate?: string;
  status: "active" | "completed" | "discontinued";
  discontinuedAt?: string;
  reason?: string;
};

export type MedicationStatus = MedicationRegimenEntry["status"];

export type PrescriptionDraftItem = {
  medicineId: string;
  medicineName: string;
  genericName?: string;
  brandLabel: string;
  dosage: string;
  frequency: string;
  route: string;
  duration: Duration;
  instructions?: string;
};

export function durationToDays(duration: Duration): number {
  switch (duration.unit) {
    case "weeks":
      return duration.value * 7;
    case "months":
      return duration.value * 30;
    default:
      return duration.value;
  }
}

export function formatDuration(duration: Duration): string {
  const unit = duration.unit === "days" ? "day" : duration.unit === "weeks" ? "week" : "month";
  const plural = duration.value === 1 ? unit : `${unit}s`;
  return `${duration.value} ${plural}`;
}