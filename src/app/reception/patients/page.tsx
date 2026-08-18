"use client";

import { useRouter } from "next/navigation";
import { PatientSearch } from "@/features/registration/components/PatientSearch";
import type { PatientSearchResult } from "@/features/registration/types/registration.types";

export default function ReceptionPatientsPage() {
  const router = useRouter();

  function handleSelect(patient: PatientSearchResult) {
    router.push(`/reception/patients/${patient.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Find Patient</h1>
        <p className="mt-1 text-sm text-ink-500">
          Search registered patients across hospitals. Press Ctrl+K anywhere in the reception
          workspace to return here.
        </p>
      </div>
      <PatientSearch autoFocus onSelect={handleSelect} onRegisterNew={() => router.push("/reception/registration")} />
    </div>
  );
}