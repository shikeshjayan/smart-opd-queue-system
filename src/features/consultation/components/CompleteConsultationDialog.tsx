import type { Encounter } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { CompletionChecklist } from "../types/consultation.types";

type CompleteConsultationDialogProps = {
  open: boolean;
  encounter: Encounter;
  checklist: CompletionChecklist;
  isCompleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const ITEMS: Array<{ key: keyof CompletionChecklist; label: string }> = [
  { key: "diagnosisEntered", label: "Diagnosis entered" },
  { key: "treatmentRecorded", label: "Treatment recorded" },
  { key: "requiredFieldsComplete", label: "Required fields completed" },
  { key: "followUpRecorded", label: "Follow-up decision recorded" },
];

export function CompleteConsultationDialog({
  open,
  encounter,
  checklist,
  isCompleting,
  onClose,
  onConfirm,
}: CompleteConsultationDialogProps) {
  const allChecked = ITEMS.every((item) => checklist[item.key]);

  return (
    <Dialog open={open} onClose={onClose} title="Complete consultation?">
      <p className="text-sm text-ink-700">
        Before completing the consultation for token{" "}
        <span className="font-semibold tabular-nums">{encounter.tokenNumber}</span>, confirm the
        following:
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {ITEMS.map((item) => {
          const done = checklist[item.key];
          return (
            <li key={item.key} className="flex items-center gap-2 text-sm">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done ? "bg-status-success-soft text-status-success" : "bg-ink-100 text-ink-400"
                }`}
              >
                {done ? "✓" : ""}
              </span>
              <span className={done ? "text-ink-900" : "text-ink-400"}>{item.label}</span>
            </li>
          );
        })}
      </ul>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" disabled={isCompleting} onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={isCompleting || !allChecked} onClick={onConfirm}>
          {isCompleting ? "Completing..." : "Complete"}
        </Button>
      </div>
    </Dialog>
  );
}