"use client";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { DocumentsWorkspace } from "@/features/medical-documents/components/DocumentsWorkspace";

export default function PatientDocumentsPage() {
  const { user } = useAuth();
  if (!user?.id) return null;
  return <DocumentsWorkspace patientId={user.id} audience="patient" />;
}