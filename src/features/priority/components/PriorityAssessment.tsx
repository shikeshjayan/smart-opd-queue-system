"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PermissionGuard } from "@/features/auth/components/PermissionGuard";
import { PriorityBadge } from "./PriorityBadge";
import type { PriorityLevel, AssessmentRow } from "../types/priority.types";

const LEVELS: Array<{ value: PriorityLevel; label: string; description: string }> = [
  { value: "normal", label: "Normal", description: "Standard OPD handling." },
  { value: "priority", label: "Priority", description: "Approved priority handling." },
  { value: "emergency", label: "Emergency", description: "Urgent attention required." },
];

type PriorityAssessmentProps = {
  open: boolean;
  row: AssessmentRow | null;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (level: PriorityLevel, notes?: string) => void;
};

export function PriorityAssessment({ open, row, busy = false, onClose, onConfirm }: PriorityAssessmentProps) {
  const [level, setLevel] = useState<PriorityLevel>(row?.priority ?? "normal");
  const [notes, setNotes] = useState("");

  if (!row) return null;

  return (
    <Dialog open={open} onClose={onClose} title="Priority Assessment">
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-500">Patient</dt>
          <dd className="font-medium text-ink-900">
            {row.patientName ?? "Unknown"}
            {row.patientId ? ` · ${row.patientId}` : ""}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-500">Token</dt>
          <dd className="font-semibold tabular-nums text-ink-900">{row.tokenNumber}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-500">OPD</dt>
          <dd className="font-medium text-ink-900">{row.opdName}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-500">Current</dt>
          <dd>
            <PriorityBadge priority={row.priority} />
          </dd>
        </div>
      </dl>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium text-ink-900">Priority</legend>
        <div className="mt-2 flex flex-col gap-2">
          {LEVELS.map((option) => (
            <label
              key={option.value}
              className={`flex items-center gap-3 rounded-card border p-3 text-sm transition-colors ${
                level === option.value
                  ? "border-brand-600 bg-brand-50"
                  : "border-ink-200 hover:border-ink-300"
              }`}
            >
              <input
                type="radio"
                name="priority-level"
                value={option.value}
                checked={level === option.value}
                onChange={() => setLevel(option.value)}
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

      <label className="mt-5 block">
        <span className="text-sm font-medium text-ink-900">Assessment Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Operational notes (not clinical details)…"
          className="mt-1 w-full rounded-btn border border-ink-300 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-600 focus:outline-none"
        />
      </label>

      <PermissionGuard permission="ASSESS_PRIORITY">
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={() => onConfirm(level, notes.trim() || undefined)}>
            {busy ? "Saving…" : "Confirm Priority"}
          </Button>
        </div>
      </PermissionGuard>
    </Dialog>
  );
}
