export type DurationUnit = "days" | "weeks" | "months";

export type Duration = {
  value: number;
  unit: DurationUnit;
};

export type PrescribedMedicineStatus = "prescribed" | "dispensed" | "discontinued" | "cancelled";

export type DispensedBatchRef = {
  stockId: string;
  batchNumber: string;
  expiryDate?: string;
  qty: number;
};

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
  /** Total units prescribed (e.g. 10 tablets). Falls back to prescribedQuantity() estimate when absent. */
  quantity?: number;
  dispensedQty?: number;
  dispensedBatches?: DispensedBatchRef[];
  dispensedAt?: string;
};

/** Doses per day estimated from the free-text frequency ("2 × daily" -> 2). */
function dosesPerDay(frequency: string): number {
  const f = frequency.toLowerCase();
  if (f.includes("sos") || f.includes("as needed")) return 1;
  if (f.includes("weekly")) return 1 / 7;
  if (f.includes("od") || f.includes("once") || f.includes("1 ×") || f.includes("1x")) return 1;
  if (f.includes("tds") || f.includes("thrice") || f.includes("3 ×") || f.includes("3x")) return 3;
  if (f.includes("qds") || f.includes("four") || f.includes("4 ×") || f.includes("4x")) return 4;
  if (f.includes("bd") || f.includes("twice") || f.includes("2 ×") || f.includes("2x")) return 2;
  const m = f.match(/(\d+)\s*(?:×|x|times)/);
  if (m) return Number(m[1]) || 1;
  return 1;
}

/** Units to dispense for a prescription item; explicit quantity wins over the estimate. */
export function prescribedQuantity(med: Pick<PrescribedMedicine, "quantity" | "frequency" | "durationDays">): number {
  if (typeof med.quantity === "number" && med.quantity > 0) return med.quantity;
  return Math.max(1, Math.round(dosesPerDay(med.frequency) * Math.max(1, med.durationDays)));
}

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