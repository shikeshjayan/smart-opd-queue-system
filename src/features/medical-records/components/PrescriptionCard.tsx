import { Badge } from "@/components/ui/badge";
import type { Prescription } from "../types/medical-record.types";
import { formatDate } from "../utils/format";

const statusVariant: Record<Prescription["status"], "success" | "default" | "danger"> = {
  active: "success",
  completed: "default",
  cancelled: "danger",
};

export function PrescriptionCard({ prescription }: { prescription: Prescription }) {
  const medicineCount = prescription.medicines.length;
  return (
    <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink-900">{formatDate(prescription.issuedAt)}</p>
          <p className="text-sm text-ink-700">{prescription.departmentName}</p>
          <p className="text-sm text-ink-500">{prescription.hospitalName}</p>
          <p className="mt-1.5 text-xs text-ink-500">{prescription.doctorName}</p>
        </div>
        <div className="text-right">
          <Badge variant={statusVariant[prescription.status]}>
            {prescription.status === "active" ? "Active" : prescription.status === "completed" ? "Completed" : "Cancelled"}
          </Badge>
          <p className="mt-1.5 text-xs text-ink-500">
            {medicineCount} medicine{medicineCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </div>
  );
}