"use client";

import { DEMO_PATIENT_ID } from "@/config/app";
import { DocumentsWorkspace } from "@/features/medical-documents/components/DocumentsWorkspace";

export default function PatientDocumentsPage() {
  return <DocumentsWorkspace patientId={DEMO_PATIENT_ID} audience="patient" />;
}