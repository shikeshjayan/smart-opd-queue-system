"use client";

import { useState } from "react";
import { useReports } from "@/features/government-admin/hooks/useGovernmentAdmin";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { ExportActions } from "@/features/government-admin/components/ExportActions";
import { DateRangeFilter } from "@/components/date-range-filter";
import { Card, CardContent } from "@/components/ui/card";
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
import type { GovernmentReportRow } from "@/services/government/types";

export default function StateReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading, error, reload } = useReports("state", null, {
    from: from || undefined,
    to: to || undefined,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-40 w-full" />
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
        description={`State-wide operational report · ${data.period}`}
        actions={<ExportActions />}
      />

      <Card>
        <CardContent className="pt-6">
          <DateRangeFilter from={from} to={to} onApply={(f, t) => { setFrom(f); setTo(t); }} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-ink-500">Tokens</p>
            <p className="mt-1 text-3xl font-bold text-ink-900">{data.totals.tokens}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-ink-500">Completed</p>
            <p className="mt-1 text-3xl font-bold text-ink-900">{data.totals.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-ink-500">Consultations</p>
            <p className="mt-1 text-3xl font-bold text-ink-900">{data.totals.consultations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-ink-500">Missed</p>
            <p className="mt-1 text-3xl font-bold text-ink-900">{data.totals.missed}</p>
          </CardContent>
        </Card>
      </div>

      <div className="hidden md:block">
        <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted">
                <TableHead>District</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Waiting</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row: GovernmentReportRow) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-ink-900">{row.label}</TableCell>
                  <TableCell className="text-right text-ink-700">{row.tokens}</TableCell>
                  <TableCell className="text-right text-ink-700">{row.completed}</TableCell>
                  <TableCell className="text-right text-ink-700">{row.waiting}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {data.rows.map((row: GovernmentReportRow) => (
          <li key={row.id} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
            <p className="font-medium text-ink-900">{row.label}</p>
            <p className="mt-1 text-sm text-ink-700">
              {row.tokens} tokens &middot; {row.completed} completed &middot; {row.waiting} waiting
            </p>
          </li>
        ))}
      </ul>

      <section aria-labelledby="recent-encounters-title">
        <h2 id="recent-encounters-title" className="mb-3 text-lg font-semibold text-ink-900">
          Recent Encounters
        </h2>
        <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
          <ul className="flex flex-col divide-y divide-ink-200">
            {data.recentEncounters.map((encounter) => (
              <li key={encounter.id} className="flex flex-wrap items-center justify-between gap-2 bg-surface p-4">
                <div>
                  <p className="font-medium text-ink-900">{encounter.patientName}</p>
                  <p className="text-sm text-ink-500">
                    {encounter.hospitalName} &middot; {encounter.departmentName}
                  </p>
                </div>
                <span className="text-sm text-ink-500">{encounter.date}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
