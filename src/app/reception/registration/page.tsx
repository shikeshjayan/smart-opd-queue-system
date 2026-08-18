"use client";

import { useState } from "react";
import { RegistrationWizard } from "@/features/registration/components/RegistrationWizard";
import { useReception } from "@/features/registration/reception-context";

function initialPatientId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return new URLSearchParams(window.location.search).get("patient") ?? undefined;
}

export default function ReceptionRegistrationPage() {
  const { hospitalId, hospital } = useReception();
  const [initial] = useState(initialPatientId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Patient Registration</h1>
        <p className="mt-1 text-sm text-ink-500">
          {hospital?.name} &middot; Walk-in and appointment token generation
        </p>
      </div>
      <RegistrationWizard
        hospitalId={hospitalId}
        hospitalName={hospital?.name ?? ""}
        initialPatientId={initial}
      />
    </div>
  );
}