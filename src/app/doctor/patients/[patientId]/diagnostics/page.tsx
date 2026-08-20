"use client";

import { use } from "react";
import { DiagnosticsWorkspace } from "@/features/diagnostics/components/DiagnosticsWorkspace";

export default function DoctorPatientDiagnosticsPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = use(params);
  return <DiagnosticsWorkspace patientId={patientId} />;
}