import type { Prescription } from "@/services/prescription/types";
import { Badge } from "@/components/ui/badge";

export function workflowStatusLabel(prescription: Prescription): string {
  if (prescription.workflowStatus === "cancelled") return "Cancelled";
  if (prescription.workflowStatus === "draft") return "Draft";
  switch (prescription.status) {
    case "dispensed":
      return "Dispensed";
    case "partially_dispensed":
      return "Partially dispensed";
    case "sent_to_pharmacy":
      return "At pharmacy";
    default:
      return "Prescribed";
  }
}

export function workflowStatusVariant(
  prescription: Prescription
): "default" | "success" | "warning" | "danger" | "info" {
  if (prescription.workflowStatus === "cancelled") return "danger";
  if (prescription.workflowStatus === "draft") return "default";
  if (prescription.status === "dispensed") return "success";
  if (prescription.status === "partially_dispensed") return "warning";
  if (prescription.status === "sent_to_pharmacy") return "info";
  return "default";
}

export function PrescriptionStatus({ prescription }: { prescription: Prescription }) {
  return (
    <Badge variant={workflowStatusVariant(prescription)}>
      {workflowStatusLabel(prescription)}
    </Badge>
  );
}