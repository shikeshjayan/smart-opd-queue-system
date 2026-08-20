import { useCallback, useRef, useState } from "react";
import { useAsync } from "@/lib/use-async";
import type { DiagnosticOrder, DiagnosticOrderContextRef, DiagnosticOrderItem } from "@/services/diagnostics/types";
import { diagnosticsMockApi } from "../api/diagnostics.mock";
import { validateOrderItems } from "../utils/diagnostics-validation";

export function usePatientOrders(patientId: string) {
  return useAsync(() => diagnosticsMockApi.listForPatient(patientId), [patientId]);
}

export function useSpecimen(orderId: string) {
  return useAsync(() => diagnosticsMockApi.getSpecimenForOrder(orderId), [orderId]);
}

export function useOrder(orderId: string | null | undefined) {
  return useAsync(
    () =>
      orderId
        ? Promise.all([
            diagnosticsMockApi.getOrder(orderId),
            diagnosticsMockApi.getSpecimenForOrder(orderId),
            diagnosticsMockApi.listResultsForOrder(orderId),
          ])
        : Promise.resolve(null),
    [orderId]
  );
}

type UseOrderWorkflowArgs = {
  encounterId: string;
  ref: DiagnosticOrderContextRef;
};

export function useOrderWorkflow({ encounterId, ref }: UseOrderWorkflowArgs) {
  const [items, setItems] = useState<DiagnosticOrderItem[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [draft, setDraft] = useState<DiagnosticOrder | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const draftRef = useRef<DiagnosticOrder | null>(null);

  const persist = useCallback(
    async (nextItems: DiagnosticOrderItem[], nextNotes: string) => {
      setSaving(true);
      setError(null);
      try {
        const existing = draftRef.current;
        const saved = existing
          ? await diagnosticsMockApi.updateDraft(existing.id, nextItems, nextNotes || undefined)
          : await diagnosticsMockApi.createDraft(encounterId, ref, nextItems, nextNotes || undefined);
        if (saved) {
          draftRef.current = saved;
          setDraft(saved);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unable to save order");
      } finally {
        setSaving(false);
      }
    },
    [encounterId, ref]
  );

  const updateItems = useCallback(
    (nextItems: DiagnosticOrderItem[]) => {
      setItems(nextItems);
      if (nextItems.length === 0) return;
      void persist(nextItems, clinicalNotes);
    },
    [persist, clinicalNotes]
  );

  const updateNotes = useCallback(
    (nextNotes: string) => {
      setClinicalNotes(nextNotes);
      if (items.length === 0) return;
      void persist(items, nextNotes);
    },
    [persist, items]
  );

  const saveDraft = useCallback(() => {
    if (items.length === 0) return;
    void persist(items, clinicalNotes);
  }, [persist, items, clinicalNotes]);

  const submit = useCallback(async (): Promise<DiagnosticOrder | null> => {
    const { valid } = validateOrderItems(items);
    if (!valid) {
      setError("Add at least one test to the order.");
      return null;
    }
    setSubmitting(true);
    setError(null);
    try {
      let current = draftRef.current;
      if (!current) {
        const created = await diagnosticsMockApi.createDraft(encounterId, ref, items, clinicalNotes || undefined);
        if (!created) return null;
        current = created;
        draftRef.current = created;
        setDraft(created);
      }
      const submitted = await diagnosticsMockApi.submitOrder(current.id);
      if (submitted) {
        draftRef.current = submitted;
        setDraft(submitted);
        setItems([]);
        setClinicalNotes("");
        return submitted;
      }
      return null;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to submit order");
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [encounterId, ref, items, clinicalNotes]);

  return {
    items,
    updateItems,
    clinicalNotes,
    updateNotes,
    draft,
    saving,
    error,
    submitting,
    saveDraft,
    submit,
  };
}