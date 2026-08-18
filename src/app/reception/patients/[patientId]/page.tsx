"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TokenStatus } from "@/features/token/components/TokenStatus";
import { useAsync } from "@/lib/use-async";
import { registrationMockApi } from "@/features/registration/api/registration.mock";
import { usePatientActivity } from "@/features/registration/hooks/useRegistration";
import { formatDate } from "@/features/medical-records/utils/format";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";

export default function ReceptionPatientDetailPage() {
  const params = useParams<{ patientId: string }>();
  const patientId = params.patientId;
  const patient = useAsync(() => registrationMockApi.getPatientById(patientId), [patientId]);
  const activity = usePatientActivity(patientId);

  if (patient.isLoading || activity.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (patient.error || !patient.data) {
    return <ErrorState message={patient.error ?? "Patient not found."} onRetry={patient.reload} />;
  }

  const { age, gender, name, phone, bloodGroup } = patient.data;
  const records = activity.data?.records ?? [];
  const tokens = activity.data?.tokens ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/reception/patients"
          className="text-sm text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
        >
          &larr; Back to Find Patient
        </Link>
        <div className="mt-2">
          <h1 className="text-2xl font-bold text-ink-900">{name}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {patientId} &middot; {age} yrs &middot; {gender}
          </p>
        </div>
      </div>

      <div className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <h2 className="text-lg font-semibold text-ink-900">Registration Details</h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-ink-500">Phone</dt>
            <dd className="mt-0.5 font-medium tabular-nums text-ink-900">{phone}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500">Blood group</dt>
            <dd className="mt-0.5 font-medium text-ink-900">{bloodGroup ?? "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink-900">Visit History</h2>
        <Link href={`/reception/registration?patient=${patientId}`}>
          <Button size="md">Register OPD Visit</Button>
        </Link>
      </div>

      <section aria-labelledby="visit-history-title">
        <h2 id="visit-history-title" className="sr-only">
          Visit history
        </h2>
        {records.length === 0 ? (
          <EmptyState title="No registrations yet" description="This patient has no visits at this desk." />
        ) : (
          <ul className="flex flex-col gap-2">
            {records.map((record) => {
              const token = tokens.find((t) => t.tokenNumber === record.tokenNumber);
              return (
                <li
                  key={record.id}
                  className="rounded-card border border-ink-200 bg-surface p-4 shadow-card"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono font-semibold tabular-nums text-brand-700">
                        {record.tokenNumber}
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-ink-900">
                        {record.departmentName} &middot; {record.opdName}
                      </p>
                      <p className="text-xs text-ink-500">
                        {formatDate(record.createdAt.slice(0, 10))} &middot;{" "}
                        {record.createdAt.slice(11, 16)} &middot;{" "}
                        {record.registrationType === "appointment" ? "Appointment" : "Walk-in"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {record.isNewPatient && <Badge variant="info">New</Badge>}
                      {token ? (
                        <TokenStatus status={token.status} />
                      ) : (
                        <Badge variant={record.status === "cancelled" ? "danger" : "success"}>
                          {record.status === "cancelled" ? "Cancelled" : "Active"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {record.cancelledReason && (
                    <p className="mt-2 text-xs text-ink-500">
                      Cancelled &middot; {record.cancelledReason}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="rounded-card border border-dashed border-ink-300 bg-surface-muted p-4">
        <p className="text-sm font-medium text-ink-700">Reception access</p>
        <p className="mt-1 text-sm text-ink-500">
          Allergies, medications and medical conditions are restricted to clinical staff. This
          registration view is limited to identity and visit tracking.
        </p>
      </div>
    </div>
  );
}