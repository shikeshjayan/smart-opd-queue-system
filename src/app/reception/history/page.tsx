"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/features/medical-records/components/Pagination";
import {
  useOpdAvailability,
  useRegistrations,
} from "@/features/registration/hooks/useRegistration";
import { useReception } from "@/features/registration/reception-context";
import { formatDate } from "@/features/medical-records/utils/format";
import type { RegistrationFilters, RegistrationType } from "@/features/registration/types/registration.types";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";

const PAGE_SIZE = 10;

const TYPE_LABELS: Record<RegistrationType, string> = {
  walk_in: "Walk-in",
  appointment: "Appointment",
};

export default function ReceptionHistoryPage() {
  const { hospitalId } = useReception();
  const opds = useOpdAvailability(hospitalId);
  const [filters, setFilters] = useState<RegistrationFilters>({});
  const [page, setPage] = useState(1);
  const list = useRegistrations(filters, page, PAGE_SIZE);

  const departmentOptions = useMemo(
    () => [...new Map((opds.data ?? []).map((opd) => [opd.departmentId, opd.departmentName])).entries()],
    [opds.data]
  );
  const opdOptions = useMemo(
    () => (opds.data ?? []).filter((opd) => !filters.departmentId || opd.departmentId === filters.departmentId),
    [opds.data, filters.departmentId]
  );

  function updateFilters(patch: Partial<RegistrationFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Registration History</h1>
        <p className="mt-1 text-sm text-ink-500">Records for this reception desk, newest first.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Date</span>
          <Input
            type="date"
            value={filters.date ?? ""}
            onChange={(e) => updateFilters({ date: e.target.value || undefined })}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Department</span>
          <Select
            value={filters.departmentId ?? ""}
            onChange={(e) =>
              updateFilters({ departmentId: e.target.value || undefined, opdId: undefined })
            }
            aria-label="Filter by department"
          >
            <option value="">All departments</option>
            {departmentOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">OPD</span>
          <Select
            value={filters.opdId ?? ""}
            onChange={(e) => updateFilters({ opdId: e.target.value || undefined })}
            aria-label="Filter by OPD"
          >
            <option value="">All OPDs</option>
            {opdOptions.map((opd) => (
              <option key={opd.opdId} value={opd.opdId}>
                {opd.opdName}
              </option>
            ))}
          </Select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Type</span>
          <Select
            value={filters.type ?? ""}
            onChange={(e) =>
              updateFilters({ type: (e.target.value || undefined) as RegistrationType | undefined })
            }
            aria-label="Filter by registration type"
          >
            <option value="">All types</option>
            <option value="walk_in">Walk-in</option>
            <option value="appointment">Appointment</option>
          </Select>
        </label>
        {(filters.date || filters.departmentId || filters.opdId || filters.type) && (
          <button
            type="button"
            onClick={() => setFilters({})}
            className="rounded-btn border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100"
          >
            Clear
          </button>
        )}
      </div>

      {list.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : list.data && list.data.items.length > 0 ? (
        <>
          <div className="hidden md:block">
            <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">Date</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Patient</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Department / OPD</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Token</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Type</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {list.data.items.map((record) => (
                    <tr key={record.id}>
                      <td className="px-4 py-2.5 whitespace-nowrap text-ink-700">
                        {formatDate(record.createdAt.slice(0, 10))}
                        <span className="text-ink-400"> {record.createdAt.slice(11, 16)}</span>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-ink-900">{record.patientName}</td>
                      <td className="px-4 py-2.5 text-ink-700">
                        {record.departmentName}
                        <span className="text-ink-400"> · {record.opdName}</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono font-semibold tabular-nums text-brand-700">
                        {record.tokenNumber}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant="default">{TYPE_LABELS[record.registrationType]}</Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={record.status === "cancelled" ? "danger" : "success"}>
                          {record.status === "cancelled" ? "Cancelled" : "Active"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {list.data.items.map((record) => (
              <li key={record.id} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink-900">{record.patientName}</p>
                    <p className="text-sm text-ink-500">
                      {record.departmentName} · {record.opdName}
                    </p>
                    <p className="text-xs text-ink-400">
                      {formatDate(record.createdAt.slice(0, 10))} · {record.createdAt.slice(11, 16)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold tabular-nums text-brand-700">
                      {record.tokenNumber}
                    </p>
                    <Badge variant={record.status === "cancelled" ? "danger" : "success"} className="mt-1">
                      {record.status === "cancelled" ? "Cancelled" : "Active"}
                    </Badge>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Pagination
            page={list.data.page}
            pageSize={list.data.pageSize}
            total={list.data.total}
            onPageChange={setPage}
          />
        </>
      ) : (
        <EmptyState title="No registrations match" description="Try adjusting your filters." />
      )}
    </div>
  );
}