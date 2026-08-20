"use client";

import { use } from "react";
import { PrescriptionWorkspace } from "@/features/prescription/components/PrescriptionWorkspace";

export default function DoctorPatientPrescriptionPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = use(params);
  return <PrescriptionWorkspace patientId={patientId} />;
}