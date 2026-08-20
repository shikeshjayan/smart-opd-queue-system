import { useState } from "react";
import { consultationMockApi } from "../api/consultation.mock";
import type { ConsultationSections } from "@/services/consultation/types";
import type { PrescriptionDraftItem } from "@/services/prescription/types";

export function useConsultationComplete() {
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function complete(
    encounterId: string,
    sections: ConsultationSections,
    prescriptionItems: PrescriptionDraftItem[],
    instructions?: string
  ) {
    setIsCompleting(true);
    setError(null);
    try {
      const { context } = await consultationMockApi.complete(
        encounterId,
        sections,
        prescriptionItems,
        instructions
      );
      return context;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to complete consultation");
      return null;
    } finally {
      setIsCompleting(false);
    }
  }

  return { complete, isCompleting, error };
}