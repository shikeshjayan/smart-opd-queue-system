"use client";
import { useState, useEffect } from "react";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { stateAdminService } from "@/services/state";
import type { ExportableReport } from "@/lib/report-export";

const REPORT_TYPES = [
  "OPD Performance", "Hospital Performance", "District Performance",
  "Service Availability", "Capacity Report", "Waiting Time Report",
  "Appointment Report", "Diagnostic Report", "Resource Report"
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState("opd_performance");
  const [data, setData] = useState<ExportableReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    stateAdminService.getReport(reportType as "opd_performance")
      .then((result) => { if (active) { setData(result); setError(null); } })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Failed"); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [reportType]);

  if (isLoading) return <Skeleton className="h-64" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="State Reports"
        description="Generate and export state-wide reports"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {REPORT_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setReportType(type.toLowerCase().replace(/\s+/g, "_"))}
            className={`p-4 border rounded-card text-left transition-colors ${
              reportType === type.toLowerCase().replace(/\s+/g, "_")
                ? "bg-brand-50 border-brand-300"
                : "border-ink-200 hover:bg-ink-50"
            }`}
          >
            <span className="font-medium text-ink-900">{type}</span>
          </button>
        ))}
      </div>
      {data && (
        <div className="mt-8 p-6 border border-ink-200 rounded-card bg-surface">
          <h3 className="text-lg font-semibold mb-4 capitalize">
            {reportType.replace(/_/g, " ")} Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {data.summary.map((item, i) => (
              <div key={i} className="p-4 bg-ink-50 rounded-card text-center">
                <div className="text-sm text-ink-500">{item.label}</div>
                <div className="text-2xl font-bold text-ink-900">
                  {typeof item.value === "number" ? item.value.toLocaleString("en-IN") : item.value}
                </div>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200">
                  {data.table.columns.map((col) => (
                    <th key={col} className="text-left p-2 font-medium text-ink-700">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.table.rows.map((row, i) => (
                  <tr key={i} className="border-b border-ink-100 last:border-0">
                    {row.map((cell, j) => (
                      <td key={j} className="p-2 text-ink-700">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
