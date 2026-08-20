import type { DurationUnit, PrescriptionDraftItem } from "@/services/prescription/types";

export type PrescriptionItemErrors = {
  medicineId?: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  durationValue?: string;
  durationUnit?: string;
};

export type PrescriptionValidationResult = {
  valid: boolean;
  itemErrors: PrescriptionItemErrors[];
  prescriptionError: string | null;
};

const UNITS: DurationUnit[] = ["days", "weeks", "months"];

export function validateItem(item: PrescriptionDraftItem): PrescriptionItemErrors {
  const errors: PrescriptionItemErrors = {};

  if (!item.medicineId) errors.medicineId = "Medicine required";
  if (!item.medicineName.trim()) errors.medicineId = "Medicine required";
  if (!item.dosage.trim()) errors.dosage = "Dosage required";
  if (!item.frequency.trim()) errors.frequency = "Frequency required";
  if (!item.route.trim()) errors.route = "Route required";

  const value = item.duration.value;
  if (!Number.isFinite(value) || value < 1) {
    errors.durationValue = "Duration required";
  } else if (!Number.isInteger(value)) {
    errors.durationValue = "Use a whole number";
  }

  if (!UNITS.includes(item.duration.unit)) {
    errors.durationUnit = "Invalid duration unit";
  }

  return errors;
}

export function validatePrescription(items: PrescriptionDraftItem[]): PrescriptionValidationResult {
  if (items.length === 0) {
    return { valid: false, itemErrors: [], prescriptionError: "Add at least one medicine." };
  }

  const itemErrors = items.map(validateItem);
  const valid = itemErrors.every((errors) => Object.keys(errors).length === 0);

  return { valid, itemErrors, prescriptionError: valid ? null : "Review the highlighted fields before finalizing." };
}