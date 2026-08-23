"use client";

import { PatientSearch } from "@/features/medical-records/components/PatientSearch";
import { RoleGuard } from "@/features/auth/components/RoleGuard";

export default function HospitalPatientSearchPage() {
  return (
    <RoleGuard roles={["hospital_admin", "doctor", "receptionist", "clinical_staff", "lab_staff"]}>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        <header>
          <h1 className="text-xl font-semibold text-ink-900">Patient Search</h1>
          <p className="mt-1 text-sm text-ink-500">
            Search by patient number, name, or phone number to view medical records.
          </p>
        </header>

        <PatientSearch />
      </main>
    </RoleGuard>
  );
}
