"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAsync } from "@/lib/use-async";
import { doctorMockApi } from "@/features/doctor/api/doctor.mock";
import { LoadingState } from "@/components/feedback/loading-state";
import { ErrorState } from "@/components/feedback/error-state";

export default function ConsultationRedirectPage({
  params,
}: {
  params: Promise<{ encounterId: string }>;
}) {
  const { encounterId } = use(params);
  const router = useRouter();
  const { data, isLoading, error } = useAsync(() => doctorMockApi.getEncounter(encounterId), [encounterId]);

  useEffect(() => {
    if (data) {
      router.replace(`/doctor/patients/${data.patientId}/consultation`);
    }
  }, [data, router]);

  if (isLoading) return <LoadingState message="Opening consultation workspace..." />;
  if (error || !data) {
    return <ErrorState message={error ?? "Encounter not found."} />;
  }
  return <LoadingState message="Redirecting to the consultation workspace..." />;
}