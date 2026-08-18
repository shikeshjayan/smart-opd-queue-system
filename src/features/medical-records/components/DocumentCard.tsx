import { Badge } from "@/components/ui/badge";
import type { MedicalDocument } from "../types/medical-record.types";
import { documentTypeLabel, formatDate } from "../utils/format";

const typeVariant: Record<string, "default" | "info" | "success"> = {
  lab_report: "info",
  prescription: "success",
  discharge_summary: "default",
  referral: "default",
  medical_certificate: "default",
  other: "default",
};

export function DocumentCard({ document }: { document: MedicalDocument }) {
  return (
    <li className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-ink-900">{document.name}</p>
          <p className="mt-0.5 text-sm text-ink-500">
            {formatDate(document.date)} &middot; {document.hospitalName}
          </p>
        </div>
        <Badge variant={typeVariant[document.type] ?? "default"}>
          {documentTypeLabel(document.type)}
        </Badge>
      </div>
    </li>
  );
}