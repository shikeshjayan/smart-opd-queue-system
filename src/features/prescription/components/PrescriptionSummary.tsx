import type { ReactNode } from "react";
import type { Prescription } from "@/services/prescription/types";
import { formatDate } from "@/features/medical-records/utils/format";
import { PrescriptionStatus } from "./PrescriptionStatus";

type PrescriptionSummaryProps = {
  prescription: Prescription;
  actions?: ReactNode;
};

export function PrescriptionSummary({ prescription, actions }: PrescriptionSummaryProps) {
  const date = prescription.finalizedAt ?? prescription.createdAt;
  const count = prescription.medicines.length;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-ink-200 bg-surface px-4 py-3 shadow-card">
      <div>
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink-900">
          #{prescription.id}
          <span className="text-xs font-normal text-ink-500">
            {formatDate(date.slice(0, 10))}
          </span>
        </p>
        <p className="mt-0.5 text-xs text-ink-500">
          {prescription.departmentName} · {prescription.doctorName} · {count} medicine
          {count === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <PrescriptionStatus prescription={prescription} />
        {actions}
      </div>
    </div>
  );
}