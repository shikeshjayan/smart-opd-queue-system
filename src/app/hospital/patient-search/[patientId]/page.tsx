"use client";

import { use } from "react";
import { RoleGuard } from "@/features/auth/components/RoleGuard";
import { ConsultationWorkspace } from "@/features/consultation/components/ConsultationWorkspace";

export default function HospitalPatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = use(params);
  return (
    <RoleGuard roles={["hospital_admin", "doctor", "receptionist", "clinical_staff", "lab_staff"]}>
      <ConsultationWorkspace patientId={patientId} defaultTab="overview" />
    </RoleGuard>
  );
}
