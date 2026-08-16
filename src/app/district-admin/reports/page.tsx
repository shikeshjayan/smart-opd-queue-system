"use client";

import { useMemo, useState } from "react";
import { useDistrictAdmin } from "@/features/government-admin/district-context";
import {
  useReports,
  useHospitalsByDistrict,
} from "@/features/government-admin/hooks/useGovernmentAdmin";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { ExportActions } from "@/features/government-admin/components/ExportActions";
import { DateRangeFilter } from "@/components/date-range-filter";
import { Select } from "@/components/ui/select";
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

export default function DistrictReportsPage() {
  const { districtId, districtName } = useDistrictAdmin();
  const [hospitalFilter, setHospitalFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: hospitalsData } = useHospitalsByDistrict(districtId ?? "ernakulam");
  const { data, isLoading, error, reload } = useReports(
    "district",
    districtId ?? "ernakulam",
    { hospitalId: hospitalFilter || undefined, from: from || undefined, to: to || undefined }
  );

  const hospitals = useMemo(
    () =>
      Array.from(new Map((hospitalsData ?? []).map((h) => [h.hospital.id, h.hospital])).values()),
    [hospitalsData]
  );

  if (isLoading || !districtId) {
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
        description={`Operational reports for ${districtName}.`}
        actions={<ExportActions />}
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <label className="block w-full max-w-xs">
              <span className="mb-1 block text-sm font-medium text-ink-700">Hospital</span>
              <Select
                value={hospitalFilter}
                onChange={(e) => setHospitalFilter(e.target.value)}
              >
                <option value="">All hospitals</option>
                {hospitals.map((hospital) => (
                  <option key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </option>
                ))}
              </Select>
            </label>
            <DateRangeFilter from={from} to={to} onApply={(f, t) => { setFrom(f); setTo(t); }} />
          </div>
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
                <TableHead>Unit</TableHead>
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
    </div>
  );
}
