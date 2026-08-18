"use client";

import Link from "next/link";
import { use } from "react";
import { Badge } from "@/components/ui/badge";
import { RecordAccessNotice } from "@/features/medical-records/components/RecordAccessNotice";
import { usePrescription } from "@/features/medical-records/hooks/useMedicalRecords";
import { formatLongDate } from "@/features/medical-records/utils/format";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function PatientPrescriptionDetailPage({
  params,
}: {
  params: Promise<{ prescriptionId: string }>;
}) {
  const { prescriptionId } = use(params);
  const { data, isLoading, error, reload } = usePrescription(prescriptionId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Prescription not found."} onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Prescription</h1>
          <p className="mt-1 text-sm text-ink-500">{formatLongDate(data.issuedAt)}</p>
        </div>
        <Link
          href="/patient/prescriptions"
          className="rounded-btn border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-brand-600"
        >
          Back to Prescriptions
        </Link>
      </div>

      <RecordAccessNotice audience="patient" />

      <section aria-labelledby="prescription-summary-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <h2 id="prescription-summary-title" className="sr-only">
          Prescription summary
        </h2>
        <dl className="divide-y divide-ink-100 text-sm">
          <div className="flex justify-between py-2">
            <dt className="text-ink-500">Patient</dt>
            <dd className="font-medium text-ink-900">Rahul K</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink-500">Doctor</dt>
            <dd className="font-medium text-ink-900">{data.doctorName}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink-500">Hospital</dt>
            <dd className="font-medium text-ink-900">{data.hospitalName}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink-500">Department</dt>
            <dd className="font-medium text-ink-900">{data.departmentName}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink-500">Status</dt>
            <dd>
              <Badge variant={data.status === "active" ? "success" : "default"}>
                {data.status === "active" ? "Active" : data.status === "completed" ? "Completed" : "Cancelled"}
              </Badge>
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="medicines-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <h2 id="medicines-title" className="text-lg font-semibold text-ink-900">
          Medicines
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
                <th scope="col" className="py-2 pr-4 font-medium">Medicine</th>
                <th scope="col" className="py-2 pr-4 font-medium">Dosage</th>
                <th scope="col" className="py-2 pr-4 font-medium">Frequency</th>
                <th scope="col" className="py-2 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody>
              {data.medicines.map((medicine) => (
                <tr key={medicine.name} className="border-b border-ink-100 last:border-b-0">
                  <td className="py-2 pr-4 font-medium text-ink-900">{medicine.name}</td>
                  <td className="py-2 pr-4 tabular-nums text-ink-700">{medicine.dosage}</td>
                  <td className="py-2 pr-4 tabular-nums text-ink-700">{medicine.frequency}</td>
                  <td className="py-2 text-ink-700">{medicine.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.instructions && (
          <p className="mt-4 border-t border-ink-100 pt-3 text-sm text-ink-700">
            <span className="font-medium text-ink-900">Instructions:</span> {data.instructions}
          </p>
        )}
      </section>
    </div>
  );
}