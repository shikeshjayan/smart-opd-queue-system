"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import { useAdminPatientDetail } from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatDate } from "@/features/hospital-admin/utils/format";
import { encounterStatusLabel } from "@/features/encounter/utils/status";

export default function PatientDetailPage() {
  const params = useParams<{ patientId: string }>();
  const patientId = params.patientId;
  const { hospitalId, hospital } = useHospitalAdmin();
  const { data, isLoading, error, reload } = useAdminPatientDetail(hospitalId, patientId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Patient not found."} onRetry={reload} />;
  }

  const { patient, encounters } = data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/hospital-admin/patients"
          className="text-sm text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
        >
          &larr; Back to Patients
        </Link>
        <div className="mt-2">
          <h1 className="text-2xl font-bold text-ink-900">{patient.name}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {patient.id} &middot; {hospital?.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registration Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-ink-500">Patient ID</dt>
              <dd className="mt-0.5 font-mono text-sm text-ink-900">{patient.id}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Registered hospital</dt>
              <dd className="mt-0.5 text-sm text-ink-900">{hospital?.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Age</dt>
              <dd className="mt-0.5 text-sm text-ink-900">{patient.age} years</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Gender</dt>
              <dd className="mt-0.5 text-sm text-ink-900">{patient.gender}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Phone</dt>
              <dd className="mt-0.5 text-sm text-ink-900">{patient.phone}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Blood group</dt>
              <dd className="mt-0.5 text-sm text-ink-900">{patient.bloodGroup ?? "Not on record"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clinical Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-token border border-dashed border-ink-300 bg-surface-muted p-4">
            <p className="text-sm font-medium text-ink-700">Requires clinical authorization</p>
            <p className="mt-1 text-sm text-ink-500">
              Allergies, current medications and medical conditions are restricted to
              authorized clinical staff. Contact the hospital&apos;s medical records office
              to request access.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>OPD Visits</CardTitle>
            <Badge variant="default">{encounters.length} visits</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {encounters.length === 0 ? (
            <EmptyState title="No OPD visits" description="This patient has no visit records." />
          ) : (
            <ul className="flex flex-col gap-2">
              {encounters.map((encounter) => (
                <li
                  key={encounter.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-token border border-ink-200 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink-900">
                      {encounter.departmentName} &middot; {encounter.doctorName}
                    </p>
                    <p className="text-sm text-ink-500">
                      Token {encounter.tokenNumber} · {formatDate(encounter.date)}
                    </p>
                  </div>
                  <Badge variant={encounter.status === "completed" ? "success" : "warning"}>
                    {encounterStatusLabel(encounter.status)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
