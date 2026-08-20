import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PrescribedMedicine,
  Prescription,
  PrescriptionContextRef,
  PrescriptionDraftItem,
} from "@/services/prescription/types";
import { prescriptionMockApi } from "../api/prescription.mock";
import { validatePrescription } from "../utils/prescription-validation";

const AUTOSAVE_DELAY_MS = 1500;

export function toDraftItem(medicine: PrescribedMedicine): PrescriptionDraftItem {
  return {
    medicineId: medicine.medicineId,
    medicineName: medicine.medicineName,
    genericName: medicine.genericName,
    brandLabel: medicine.brandLabel ?? "",
    dosage: medicine.dosage,
    frequency: medicine.frequency,
    route: medicine.route,
    duration: { ...medicine.duration },
    instructions: medicine.instructions,
  };
}

type UsePrescriptionWorkflowArgs = {
  encounterId: string;
  contextRef: PrescriptionContextRef;
  onFinalized?: (prescription: Prescription) => void;
  onCorrected?: (draft: Prescription) => void;
};

export function usePrescriptionWorkflow({
  encounterId,
  contextRef,
  onFinalized,
  onCorrected,
}: UsePrescriptionWorkflowArgs) {
  const [draft, setDraft] = useState<Prescription | null>(null);
  const [items, setItems] = useState<PrescriptionDraftItem[]>([]);
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const draftRef = useRef<Prescription | null>(null);
  const loadedRef = useRef(false);
  const pendingRef = useRef<{ items: PrescriptionDraftItem[]; instructions: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true);
    });
    prescriptionMockApi
      .getDraftForEncounter(encounterId)
      .then((existing) => {
        if (cancelled) return;
        draftRef.current = existing ?? null;
        setDraft(existing ?? null);
        if (existing) {
          setItems(existing.medicines.map(toDraftItem));
          setInstructions(existing.instructions ?? "");
        }
        loadedRef.current = true;
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Unable to load prescription draft");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [encounterId]);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const snapshot = pendingRef.current;
    if (!snapshot || !loadedRef.current || snapshot.items.length === 0 && !snapshot.instructions) {
      pendingRef.current = null;
      return;
    }
    pendingRef.current = null;
    setSaving(true);
    try {
      const existing = draftRef.current;
      const saved = existing
        ? await prescriptionMockApi.updateDraft(
            existing.id,
            snapshot.items,
            snapshot.instructions || undefined
          )
        : await prescriptionMockApi.createDraft(
            encounterId,
            contextRef,
            snapshot.items,
            snapshot.instructions || undefined
          );
      if (saved) {
        draftRef.current = saved;
        setDraft(saved);
        setSavedAt(new Date());
        setActionError(null);
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Unable to save draft");
    } finally {
      setSaving(false);
    }
  }, [encounterId, contextRef]);

  const queueSave = useCallback(
    (nextItems: PrescriptionDraftItem[], nextInstructions: string) => {
      pendingRef.current = { items: nextItems, instructions: nextInstructions };
      setSaving(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
    },
    [flush]
  );

  const updateItems = useCallback(
    (nextItems: PrescriptionDraftItem[]) => {
      setItems(nextItems);
      queueSave(nextItems, pendingRef.current?.instructions ?? instructions);
    },
    [queueSave, instructions]
  );

  const updateInstructions = useCallback(
    (nextInstructions: string) => {
      setInstructions(nextInstructions);
      queueSave(pendingRef.current?.items ?? items, nextInstructions);
    },
    [queueSave, items]
  );

  const finalize = useCallback(async (): Promise<Prescription | null> => {
    let current = draftRef.current;
    if (!current) {
      if (items.length === 0) return null;
      const created = await prescriptionMockApi.createDraft(
        encounterId,
        contextRef,
        items,
        instructions || undefined
      );
      if (!created) return null;
      current = created;
      draftRef.current = created;
      setDraft(created);
    }
    setFinalizing(true);
    setActionError(null);
    try {
      const finalized = await prescriptionMockApi.finalize(current.id);
      if (finalized) {
        draftRef.current = finalized;
        setDraft(finalized);
        onFinalized?.(finalized);
      }
      return finalized ?? null;
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Unable to finalize prescription");
      return null;
    } finally {
      setFinalizing(false);
    }
  }, [encounterId, contextRef, items, instructions, onFinalized]);

  const cancelDraft = useCallback(async () => {
    const current = draftRef.current;
    if (!current) return;
    await prescriptionMockApi.cancel(current.id, "Draft abandoned");
    draftRef.current = null;
    pendingRef.current = null;
    setDraft(null);
    setItems([]);
    setInstructions("");
  }, []);

  const requestCorrection = useCallback(async (prescription: Prescription, reason?: string) => {
    if (prescription.workflowStatus !== "finalized") return null;
    await prescriptionMockApi.cancel(prescription.id, reason ?? "Correction requested by doctor");
    const created = await prescriptionMockApi.createDraft(
      prescription.encounterId,
      contextRef,
      prescription.medicines.map(toDraftItem),
      prescription.instructions
    );
    if (created) {
      draftRef.current = created;
      pendingRef.current = null;
      setDraft(created);
      setItems(created.medicines.map(toDraftItem));
      setInstructions(created.instructions ?? "");
      onCorrected?.(created);
    }
    return created ?? null;
  }, [contextRef, onCorrected]);

  const validate = useCallback(() => validatePrescription(items), [items]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return {
    draft,
    items,
    updateItems,
    instructions,
    updateInstructions,
    loading,
    loadError,
    saving,
    savedAt,
    finalizing,
    actionError,
    flush,
    finalize,
    cancelDraft,
    requestCorrection,
    validate,
  };
}