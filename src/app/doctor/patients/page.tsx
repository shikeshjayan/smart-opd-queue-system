"use client";

import Link from "next/link";

export default function DoctorPatientsIndexPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink-900">Patients</h1>
      <section className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <p className="text-sm text-ink-700">
          Patients seen today appear in the queue. Open the queue to manage the current consultation,
          or use the consultation screen to view patient details.
        </p>
        <Link
          href="/doctor/queue"
          className="mt-4 inline-flex h-11 items-center rounded-btn bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Open Queue
        </Link>
      </section>
    </div>
  );
}
