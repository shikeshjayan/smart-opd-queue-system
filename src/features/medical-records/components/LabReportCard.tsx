import { Badge } from "@/components/ui/badge";
import type { LabReport } from "../types/medical-record.types";
import { formatDate } from "../utils/format";

export function LabReportCard({ report }: { report: LabReport }) {
  return (
    <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink-900">{report.name}</p>
          <p className="text-sm text-ink-500">{report.labName}</p>
          <p className="text-sm text-ink-500">{formatDate(report.reportedAt)}</p>
        </div>
        <Badge variant={report.status === "completed" ? "success" : "warning"}>
          {report.status === "completed" ? "Completed" : "Pending"}
        </Badge>
      </div>
    </div>
  );
}