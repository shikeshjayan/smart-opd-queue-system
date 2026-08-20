import { useCallback, useEffect, useRef, useState } from "react";
import { consultationMockApi } from "../api/consultation.mock";
import type { ConsultationSections } from "@/services/consultation/types";
import type { SaveStatus } from "../types/consultation.types";

const AUTOSAVE_DELAY_MS = 2000;

export function useConsultationDraft(encounterId: string, initial: ConsultationSections) {
  const [form, setForm] = useState<ConsultationSections>(initial);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (busy.current) return;
    busy.current = true;
    setSaveStatus("saving");
    try {
      await consultationMockApi.saveDraft(encounterId, form);
      setLastSavedAt(new Date());
      setSaveStatus("saved");
      setError(null);
      setIsDirty(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to save draft");
      setSaveStatus("idle");
    } finally {
      busy.current = false;
    }
  }, [encounterId, form]);

  const queueSave = useCallback(() => {
    setIsDirty(true);
    setSaveStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void flush();
    }, AUTOSAVE_DELAY_MS);
  }, [flush]);

  const update = useCallback(
    <K extends keyof ConsultationSections>(field: K, value: ConsultationSections[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      queueSave();
    },
    [queueSave]
  );

  const reset = useCallback(() => {
    setForm(initial);
    setIsDirty(false);
    setSaveStatus("idle");
  }, [initial]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { form, update, saveStatus, lastSavedAt, error, isDirty, flush, reset };
}