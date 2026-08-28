"use client";

import { useMemo, useState } from "react";
import { DISTRICTS, type DistrictId } from "@/config/districts";
import {
  useQueueMonitor,
  useGovernmentHospitalRows,
} from "@/features/government-admin/hooks/useGovernmentAdmin";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { LiveIndicator } from "@/features/government-admin/components/LiveIndicator";
import { QueueOverview } from "@/features/government-admin/components/QueueOverview";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import type { OPDStatus } from "@/types";

const ALL_DISTRICTS: DistrictId[] = DISTRICTS.map((d) => d.id);

export default function StateQueuesPage() {
  const [districtFilter, setDistrictFilter] = useState<DistrictId | "">("");
  const [hospitalFilter, setHospitalFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<OPDStatus | "">("");
  const [minWaiting, setMinWaiting] = useState("0");

  const { data: hospitalsData } = useGovernmentHospitalRows();
  const { data, isLoading, error, reload } = useQueueMonitor(ALL_DISTRICTS);

  const hospitals = useMemo(
    () =>
      Array.from(
        new Map((hospitalsData ?? []).map((h) => [h.hospital.id, h.hospital])).values()
      ).filter((h) => !districtFilter || h.districtId === districtFilter),
    [hospitalsData, districtFilter]
  );

  const departments = useMemo(
    () => Array.from(new Map((data ?? []).map((q) => [q.departmentId, q.departmentName])).entries()),
    [data]
  );

  const filtered = useMemo(() => {
    const rows = data ?? [];
    return rows.filter((row) => {
      if (districtFilter && row.districtId !== districtFilter) return false;
      if (hospitalFilter && row.hospitalId !== hospitalFilter) return false;
      if (departmentFilter && row.departmentId !== departmentFilter) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      if (Number(minWaiting) > 0 && row.waiting < Number(minWaiting)) return false;
      return true;
    });
  }, [data, districtFilter, hospitalFilter, departmentFilter, statusFilter, minWaiting]);

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
    return <ErrorState message={error ?? "Unable to load queues."} onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Queue Monitor"
        description="Live queue position for every OPD across Kerala."
        actions={<LiveIndicator />}
      />

      <div className="grid grid-cols-1 gap-4 rounded-card border border-ink-200 bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-700">
          District
          <Select
            value={districtFilter}
            onChange={(e) => {
              setDistrictFilter(e.target.value as DistrictId | "");
              setHospitalFilter("");
            }}
          >
            <option value="">All districts</option>
            {DISTRICTS.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-700">
          Hospital
          <Select value={hospitalFilter} onChange={(e) => setHospitalFilter(e.target.value)}>
            <option value="">All hospitals</option>
            {hospitals.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-700">
          Department
          <Select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option value="">All departments</option>
            {departments.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-700">
          Status
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OPDStatus | "")}
          >
            <option value="">Any status</option>
            <option value="open">Open</option>
            <option value="full">Full</option>
            <option value="break">Break</option>
            <option value="closed">Closed</option>
          </Select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-700">
          Queue size
          <Select value={minWaiting} onChange={(e) => setMinWaiting(e.target.value)}>
            <option value="0">Any size</option>
            <option value="20">20+ waiting</option>
            <option value="40">40+ waiting</option>
          </Select>
        </label>
      </div>

      <div className="text-sm text-ink-500">
        Showing <span className="font-semibold text-ink-900">{filtered.length}</span> of{" "}
        {data.length} queues.
      </div>

      <QueueOverview items={filtered} scope="state" />
    </div>
  );
}
