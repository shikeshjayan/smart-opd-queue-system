"use client";

import { useMemo, useState } from "react";
import { useStateHospitals } from "@/features/state-admin/hooks/useStateAdminData";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DISTRICTS } from "@/config/districts";

export default function StateHospitalsPage() {
  const [query, setQuery] = useState("");
  const [districtId, setDistrictId] = useState("");

  const filters = useMemo(() => ({
    dateRange: "today" as const,
    districtId: districtId || undefined,
    query
  }), [districtId, query]);

  const { data, isLoading, error, reload } = useStateHospitals(filters);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Unable to load hospitals."} onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="State Hospital Directory" />

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search hospitals..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select value={districtId} onChange={(e) => setDistrictId(e.target.value)}>
            <option value="">All Districts</option>
            {DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="rounded-card border border-ink-200 bg-surface shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hospital</TableHead>
              <TableHead>District</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Patients</TableHead>
              <TableHead className="text-right">Waiting</TableHead>
              <TableHead className="text-right">Load</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.hospitalId}>
                <TableCell className="font-medium text-ink-900">{row.name}</TableCell>
                <TableCell>{row.districtName}</TableCell>
                <TableCell className="capitalize">{row.type.replace("_", " ")}</TableCell>
                <TableCell>
                  <Badge variant={row.status === "online" ? "success" : "danger"}>
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{row.patients.toLocaleString("en-IN")}</TableCell>
                <TableCell className="text-right">{row.waiting}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={row.load === "alert" ? "danger" : row.load === "high_load" ? "warning" : "success"}>
                    {row.load.replace("_", " ")}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
