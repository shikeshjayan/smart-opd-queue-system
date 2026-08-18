"use client";

import Link from "next/link";
import { use } from "react";
import { Badge } from "@/components/ui/badge";
import { RecordAccessNotice } from "@/features/medical-records/components/RecordAccessNotice";
import { useLabReport } from "@/features/medical-records/hooks/useMedicalRecords";
import { formatLongDate } from "@/features/medical-records/utils/format";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function PatientLabReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = use(params);
  const { data, isLoading, error, reload } = useLabReport(reportId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Lab report not found."} onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">{data.name}</h1>
          <p className="mt-1 text-sm text-ink-500">{data.hospitalName}</p>
        </div>
        <Link
          href="/patient/lab-reports"
          className="rounded-btn border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-brand-600"
        >
          Back to Lab Reports
        </Link>
      </div>

      <RecordAccessNotice audience="patient" />

      <section aria-labelledby="lab-summary-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <h2 id="lab-summary-title" className="sr-only">
          Report summary
        </h2>
        <dl className="divide-y divide-ink-100 text-sm">
          <div className="flex justify-between py-2">
            <dt className="text-ink-500">Patient</dt>
            <dd className="font-medium text-ink-900">Rahul K</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink-500">Collected</dt>
            <dd className="font-medium tabular-nums text-ink-900">{formatLongDate(data.collectedAt)}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink-500">Reported</dt>
            <dd className="font-medium tabular-nums text-ink-900">{formatLongDate(data.reportedAt)}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink-500">Laboratory</dt>
            <dd className="font-medium text-ink-900">{data.labName}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink-500">Status</dt>
            <dd>
              <Badge variant={data.status === "completed" ? "success" : "warning"}>
                {data.status === "completed" ? "Completed" : "Pending"}
              </Badge>
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="results-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <h2 id="results-title" className="text-lg font-semibold text-ink-900">
          Results
        </h2>
        {data.results && data.results.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
                  <th scope="col" className="py-2 pr-4 font-medium">Result</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Value</th>
                  <th scope="col" className="py-2 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((result) => (
                  <tr key={result.name} className="border-b border-ink-100 last:border-b-0">
                    <td className="py-2 pr-4 font-medium text-ink-900">{result.name}</td>
                    <td className="py-2 pr-4 tabular-nums text-ink-700">
                      {result.value}{" "}
                      {result.unit ? <span className="text-ink-500">{result.unit}</span> : null}
                    </td>
                    <td className="py-2 text-ink-500">{result.range ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-500">Results will be shown once the report is completed.</p>
        )}
      </section>
    </div>
  );
}