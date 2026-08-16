"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import {
  useAdminDoctorDetail,
  useAdminMutations,
} from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { StatusConfirmDialog } from "@/features/hospital-admin/components/StatusConfirmDialog";
import { OpdStatusBadge } from "@/features/opd/components/OpdStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { formatDate } from "@/features/hospital-admin/utils/format";

export default function DoctorDetailPage() {
  const params = useParams<{ doctorId: string }>();
  const doctorId = params.doctorId;
  const { hospitalId, hospital } = useHospitalAdmin();
  const { data, isLoading, error, reload } = useAdminDoctorDetail(hospitalId, doctorId);
  const mutations = useAdminMutations();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Doctor not found."} onRetry={reload} />;
  }

  const { doctor, departmentName, opds } = data;

  async function handleConfirmToggle() {
    await mutations.setDoctorStatus(
      doctor.id,
      doctor.status === "active" ? "inactive" : "active"
    );
    setConfirmOpen(false);
    reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/hospital-admin/doctors"
          className="text-sm text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
        >
          &larr; Back to Doctors
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-ink-900">{doctor.name}</h1>
            <p className="mt-1 text-sm text-ink-500">
              {doctor.speciality} &middot; {departmentName} &middot; {hospital?.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={doctor.status === "active" ? "success" : "danger"}>
              {doctor.status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={mutations.busy}
            >
              {doctor.status === "active" ? "Deactivate" : "Activate"}
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact & Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-ink-500">Email</dt>
              <dd className="mt-0.5 text-sm text-ink-900">{doctor.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Phone</dt>
              <dd className="mt-0.5 text-sm text-ink-900">{doctor.phone}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Joined</dt>
              <dd className="mt-0.5 text-sm text-ink-900">{formatDate(doctor.joinedAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Doctor ID</dt>
              <dd className="mt-0.5 font-mono text-sm text-ink-900">{doctor.id}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assigned OPD Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {opds.length === 0 ? (
            <p className="text-sm text-ink-500">No OPD sessions assigned.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {opds.map((opd) => (
                <li
                  key={opd.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-token border border-ink-200 p-3"
                >
                  <div>
                    <Link
                      href={`/hospital-admin/opd/${opd.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {opd.name}
                    </Link>
                    <p className="text-sm text-ink-500">{opd.id}</p>
                  </div>
                  <OpdStatusBadge status={opd.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <StatusConfirmDialog
        open={confirmOpen}
        title={`${doctor.status === "active" ? "Deactivate" : "Activate"} ${doctor.name}?`}
        message={
          doctor.status === "active"
            ? `Deactivating ${doctor.name} will remove them from active duty. Their OPD sessions will show as unavailable.`
            : `Re-activating ${doctor.name} will restore their OPD sessions.`
        }
        confirmLabel={doctor.status === "active" ? "Deactivate" : "Activate"}
        busy={mutations.busy}
        onConfirm={handleConfirmToggle}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
