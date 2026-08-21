"use client";

import { useState } from "react";
import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import { useOpsReport } from "@/features/hospital-admin/hooks/useHospitalOps";
import type { ReportType } from "@/services/hospital-ops/types";
import { downloadReportCsv, printReport } from "@/features/hospital-admin/utils/report-export";
import { usePermissions } from "@/features/auth/hooks/useAuth";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";

const REPORT_TYPES: Array<{ value: ReportType; label: string }> = [
  { value: "daily_opd", label: "Daily OPD Report" },
  { value: "department_performance", label: "Department Performance" },
  { value: "appointment_report", label: "Appointment Report" },
  { value: "queue_report", label: "Queue Report" },
  { value: "patient_volume", label: "Patient Volume" },
  { value: "doctor_workload", label: "Doctor Workload" },
  { value: "laboratory_volume", label: "Laboratory Volume" },
  { value: "pharmacy_volume", label: "Pharmacy Volume" },
];

export default function ReportsPage() {
  const { hospitalId } = useHospitalAdmin();
  const [reportType, setReportType] = useState<ReportType>("daily_opd");
  const { data, isLoading, error, reload } = useOpsReport(hospitalId, reportType);
  const { can } = usePermissions();
  const canExport = can("VIEW_REPORTS") && can("EXPORT_REPORTS");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Unable to load reports."} onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description={`Operational reports · ${data.period}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={!canExport}
              title={canExport ? "Export as CSV" : "You don't have permission to export"}
              onClick={() => downloadReportCsv(data)}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              disabled={!canExport}
              title={canExport ? "Print report" : "You don't have permission to print"}
              onClick={() => printReport()}
            >
              Print
            </Button>
          </div>
        }
      />

      {!canExport && (
        <p className="rounded-card border border-status-warning bg-status-warning-soft p-3 text-sm text-status-warning">
          Exports are available to users with reporting permissions. Your scope is limited to this hospital.
        </p>
      )}

      <label className="block max-w-sm">
        <span className="sr-only">Report type</span>
        <select
          className="h-11 w-full rounded-btn border border-ink-300 bg-surface px-3 text-sm text-ink-900 focus:outline-2 focus:outline-brand-600"
          value={reportType}
          onChange={(e) => setReportType(e.target.value as ReportType)}
        >
          {REPORT_TYPES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      <article id="ops-report" aria-label={data.title} className="flex flex-col gap-4 rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <header>
          <h2 className="text-lg font-semibold text-ink-900">{data.title}</h2>
          <p className="text-xs text-ink-400">{data.period}</p>
        </header>

        {data.summary.length > 0 && (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {data.summary.map((item) => (
              <div key={item.label} className="rounded-token bg-surface-muted p-3">
                <dt className="text-xs text-ink-500">{item.label}</dt>
                <dd className="mt-1 text-xl font-bold tabular-nums text-ink-900">{item.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {data.table.rows.length === 0 ? (
          <p className="text-sm text-ink-500">No data for this report yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-muted hover:bg-surface-muted">
                  {data.table.columns.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.table.rows.map((row, i) => (
                  <TableRow key={i}>
                    {row.map((cell, j) => (
                      <TableCell key={j} className={j === 0 ? "font-medium text-ink-900" : "tabular-nums text-ink-700"}>
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </article>
    </div>
  );
}
