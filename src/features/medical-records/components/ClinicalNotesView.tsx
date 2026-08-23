"use client";

import type { ClinicalNotes } from "../types/medical-record.types";

type ClinicalNotesViewProps = {
  notes: ClinicalNotes;
};

export function ClinicalNotesView({ notes }: ClinicalNotesViewProps) {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-ink-200 bg-surface p-4 shadow-card">
      <h3 className="text-sm font-semibold text-ink-900">Clinical Notes</h3>

      {notes.chiefComplaint && (
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">Chief Complaint</dt>
          <dd className="mt-1 text-sm text-ink-700">{notes.chiefComplaint}</dd>
        </div>
      )}

      {notes.history && (
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">History</dt>
          <dd className="mt-1 text-sm text-ink-700">{notes.history}</dd>
        </div>
      )}

      {notes.examination && (
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">Examination</dt>
          <dd className="mt-1 text-sm text-ink-700">{notes.examination}</dd>
        </div>
      )}

      {notes.assessment && (
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">Assessment</dt>
          <dd className="mt-1 text-sm text-ink-700">{notes.assessment}</dd>
        </div>
      )}

      {notes.plan && (
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">Plan</dt>
          <dd className="mt-1 text-sm text-ink-700">{notes.plan}</dd>
        </div>
      )}

      {notes.followUp && (
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">Follow-up</dt>
          <dd className="mt-1 text-sm text-ink-700">{notes.followUp}</dd>
        </div>
      )}
    </div>
  );
}
