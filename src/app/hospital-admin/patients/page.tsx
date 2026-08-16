"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import { useAdminPatients } from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Input } from "@/components/ui/input";
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

export default function PatientsPage() {
  const { hospitalId } = useHospitalAdmin();
  const { data: patients, isLoading, error, reload } = useAdminPatients(hospitalId);
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !patients) {
    return <ErrorState message={error ?? "Unable to load patients."} onRetry={reload} />;
  }

  const query = search.trim().toLowerCase();
  const filtered = patients.filter(
    (patient) =>
      !query ||
      patient.name.toLowerCase().includes(query) ||
      patient.id.toLowerCase().includes(query) ||
      patient.phone.replace(/\s/g, "").includes(query.replace(/\s/g, ""))
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Patients"
        description="Patients registered at this hospital (administrative view)."
      />

      <label className="block max-w-md">
        <span className="mb-1 block text-sm font-medium text-ink-700">Search patients</span>
        <Input
          type="search"
          placeholder="Search by name, ID or phone..."
          value={search}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
        />
      </label>

      {filtered.length === 0 ? (
        <EmptyState
          title={patients.length === 0 ? "No registered patients" : "No matching patients"}
          description={
            patients.length === 0
              ? "Patients who register at this hospital will appear here."
              : "Try a different search term."
          }
        />
      ) : (
        <div className="hidden md:block">
          <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-muted hover:bg-surface-muted">
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Blood Group</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-mono text-xs text-ink-700">{patient.id}</TableCell>
                    <TableCell className="font-medium text-ink-900">
                      <Link
                        href={`/hospital-admin/patients/${patient.id}`}
                        className="text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
                      >
                        {patient.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-ink-700">{patient.age}</TableCell>
                    <TableCell className="text-ink-700">{patient.gender}</TableCell>
                    <TableCell className="whitespace-nowrap text-ink-700">{patient.phone}</TableCell>
                    <TableCell className="text-ink-700">{patient.bloodGroup ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/hospital-admin/patients/${patient.id}`}
                        className="text-sm font-medium text-brand-600 hover:underline"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <ul className="flex flex-col gap-3 md:hidden">
        {filtered.map((patient) => (
          <li key={patient.id} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/hospital-admin/patients/${patient.id}`}
                  className="font-medium text-brand-600 hover:underline"
                >
                  {patient.name}
                </Link>
                <p className="text-sm text-ink-500">
                  {patient.id} · {patient.age} yrs · {patient.gender}
                </p>
              </div>
              <span className="text-sm font-medium text-ink-700">{patient.bloodGroup ?? "—"}</span>
            </div>
            <p className="mt-2 text-sm text-ink-700">{patient.phone}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
