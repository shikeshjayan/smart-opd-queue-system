"use client";

import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import { useAdminReports } from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { EmptyState } from "@/components/feedback/empty-state";
import { formatDate } from "@/features/hospital-admin/utils/format";

export default function ReportsPage() {
  const { hospitalId } = useHospitalAdmin();
  const { data, isLoading, error, reload } = useAdminReports(hospitalId);

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

  const totalCards = [
    { id: "tokens", label: "Tokens Issued", value: data.totals.tokens },
    { id: "completed", label: "Completed", value: data.totals.completed },
    { id: "consultations", label: "Consultations", value: data.totals.consultations },
    { id: "missed", label: "Not Completed", value: data.totals.missed },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reports" description={`${data.hospital.name} · ${data.period}`} />

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {totalCards.map((item) => (
          <div key={item.id} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
            <dt className="text-xs text-ink-500">{item.label}</dt>
            <dd className="mt-1 text-3xl font-bold text-ink-900">{item.value}</dd>
          </div>
        ))}
      </dl>

      <Card>
        <CardHeader>
          <CardTitle>Activity by Department</CardTitle>
        </CardHeader>
        <CardContent>
          {data.byDepartment.length === 0 ? (
            <EmptyState title="No department activity" />
          ) : (
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-muted hover:bg-surface-muted">
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Waiting</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.byDepartment.map((row) => (
                    <TableRow key={row.departmentId}>
                      <TableCell className="font-medium text-ink-900">{row.departmentName}</TableCell>
                      <TableCell className="text-right text-ink-700">{row.tokens}</TableCell>
                      <TableCell className="text-right text-ink-700">{row.waiting}</TableCell>
                      <TableCell className="text-right font-semibold text-ink-900">
                        {row.completed}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <ul className="flex flex-col gap-2 md:hidden">
            {data.byDepartment.map((row) => (
              <li
                key={row.departmentId}
                className="flex items-center justify-between gap-2 rounded-token border border-ink-200 p-3"
              >
                <span className="font-medium text-ink-900">{row.departmentName}</span>
                <span className="text-sm text-ink-700">
                  {row.tokens} tokens · {row.completed} done
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Encounters</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentEncounters.length === 0 ? (
            <EmptyState title="No recent encounters" />
          ) : (
            <ul className="flex flex-col gap-2">
              {data.recentEncounters.map((encounter) => (
                <li
                  key={encounter.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-token border border-ink-200 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink-900">
                      {encounter.patientId} · {encounter.departmentName}
                    </p>
                    <p className="text-sm text-ink-500">
                      {encounter.doctorName} · Token {encounter.tokenNumber} ·{" "}
                      {formatDate(encounter.date)}
                    </p>
                  </div>
                  <span className="text-xs text-ink-400">{encounter.id}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
