import type { QueueEntry } from "@/types";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/features/priority/components/PriorityBadge";
import { QueueStatusBadge } from "./QueueStatusBadge";

type CurrentTokenProps = {
  entry: QueueEntry;
  onStart?: () => void;
  onOpenConsultation?: () => void;
  onComplete?: () => void;
  isBusy?: boolean;
};

export function CurrentToken({ entry, onStart, onOpenConsultation, onComplete, isBusy = false }: CurrentTokenProps) {
  return (
    <section
      aria-labelledby="current-token-title"
      className="rounded-card bg-brand-700 p-5 text-white shadow-token"
    >
      <h2 id="current-token-title" className="text-xs font-semibold uppercase tracking-wide text-brand-100">
        Currently Consulting
      </h2>
      <p className="mt-3 text-4xl font-bold tracking-tight">{entry.tokenNumber}</p>
      <p className="mt-1 text-sm text-brand-100">
        {entry.patientName ?? "Patient"} {entry.patientId ? `#${entry.patientId}` : ""}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <QueueStatusBadge status={entry.status} />
        {entry.priority !== "normal" && <PriorityBadge priority={entry.priority} />}
      </div>
      <div className="mt-5 flex flex-col gap-3">
        {entry.status === "called" && (
          <Button
            size="lg"
            disabled={isBusy}
            onClick={onStart}
            className="w-full bg-brand-500 hover:bg-brand-400 focus-visible:outline-white"
          >
            {isBusy ? "Starting..." : "Start Consultation"}
          </Button>
        )}
        {entry.status === "in_consultation" && (
          <Button
            size="lg"
            disabled={isBusy}
            onClick={onComplete}
            className="w-full bg-status-success text-white hover:bg-green-700 focus-visible:outline-white"
          >
            {isBusy ? "Completing..." : "Complete Consultation"}
          </Button>
        )}
        <Button
          size="lg"
          disabled={isBusy}
          onClick={onOpenConsultation}
          className="w-full bg-white text-brand-700 hover:bg-brand-50 focus-visible:outline-white"
        >
          Open Consultation
        </Button>
      </div>
    </section>
  );
}
