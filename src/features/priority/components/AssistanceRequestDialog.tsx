"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PermissionGuard } from "@/features/auth/components/PermissionGuard";
import type { AssistanceType } from "../types/priority.types";

const TYPE_OPTIONS: Array<{ value: AssistanceType; label: string; description: string }> = [
  { value: "mobility", label: "Mobility", description: "Wheelchair or physical assistance." },
  { value: "communication", label: "Communication", description: "Language or hearing assistance." },
  { value: "navigation", label: "Navigation", description: "Help finding departments or rooms." },
  { value: "other", label: "Other", description: "Another kind of assistance." },
];

type AssistanceRequestDialogProps = {
  open: boolean;
  busy?: boolean;
  confirmed?: boolean;
  onClose: () => void;
  onConfirm: (type: AssistanceType) => void;
};

export function AssistanceRequestDialog({
  open,
  busy = false,
  confirmed = false,
  onClose,
  onConfirm,
}: AssistanceRequestDialogProps) {
  const [type, setType] = useState<AssistanceType>("mobility");

  return (
    <Dialog open={open} onClose={onClose} title={confirmed ? "Assistance requested" : "Need assistance?"}>
      {confirmed ? (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <p className="text-sm text-ink-700">A hospital staff member will assist you shortly.</p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : (
        <>
          <fieldset>
            <legend className="text-sm font-medium text-ink-900">Type of assistance</legend>
            <div className="mt-2 flex flex-col gap-2">
              {TYPE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 rounded-card border p-3 text-sm transition-colors ${
                    type === option.value
                      ? "border-brand-600 bg-brand-50"
                      : "border-ink-200 hover:border-ink-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="assistance-type"
                    value={option.value}
                    checked={type === option.value}
                    onChange={() => setType(option.value)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  <span>
                    <span className="font-medium text-ink-900">{option.label}</span>
                    <span className="block text-xs text-ink-500">{option.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <PermissionGuard permission="REQUEST_ASSISTANCE">
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="ghost" disabled={busy} onClick={onClose}>
                Cancel
              </Button>
              <Button disabled={busy} onClick={() => onConfirm(type)}>
                {busy ? "Requesting…" : "Request Assistance"}
              </Button>
            </div>
          </PermissionGuard>
        </>
      )}
    </Dialog>
  );
}
