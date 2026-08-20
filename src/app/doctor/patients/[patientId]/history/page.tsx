"use client";

import { use } from "react";
import { ConsultationWorkspace } from "@/features/consultation/components/ConsultationWorkspace";

export default function DoctorPatientHistoryPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = use(params);
  return <ConsultationWorkspace patientId={patientId} defaultTab="history" />;
}