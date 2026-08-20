import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveMedications, useRegimenActions } from "../hooks/usePrescriptions";
import { usePermissions } from "@/features/auth/hooks/useAuth";
import { formatDate } from "@/features/medical-records/utils/format";

type ActiveMedicationListProps = {
  patientId: string;
};

type Phase = "all" | "active" | "discontinued";

export function ActiveMedicationList({ patientId }: ActiveMedicationListProps) {
  const { data, isLoading, error, reload } = useActiveMedications(patientId);
  const { discontinue, running, error: actionError } = useRegimenActions();
  const { can } = usePermissions();
  const [phase, setPhase] = useState<Phase>("active");
  const [target, setTarget] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data || data.length === 0) {
    return (
      <EmptyState title="No medications" description="Prescribed medications will appear here." />
    );
  }

  const list = data.filter((entry) => {
    if (phase === "active") return entry.status === "active";
    if (phase === "discontinued") return entry.status === "discontinued";
    return true;
  });

  const activeCount = data.filter((e) => e.status === "active").length;
  const discontinuedCount = data.length - activeCount;

  const confirmDiscontinue = async () => {
    if (!target) return;
    const ok = await discontinue(target, reason.trim() || "Clinician decision");
    setTarget(null);
    setReason("");
    if (ok) reload();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["active", `Active (${activeCount})`],
            ["discontinued", `Discontinued (${discontinuedCount})`],
            ["all", "All"],
          ] as Array<[Phase, string]>
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={phase === value}
            onClick={() => setPhase(value)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              phase === value
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-ink-300 text-ink-600 hover:bg-ink-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {actionError && (
        <p className="mt-3 rounded-card border border-status-danger-soft bg-status-danger-soft p-3 text-sm text-status-danger">
          {actionError}
        </p>
      )}

      {list.length === 0 ? (
        <p className="mt-4 text-sm text-ink-500">No medications in this phase.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {list.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-ink-200 px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-ink-900">{entry.genericName}</p>
                <p className="text-xs text-ink-500">
                  {entry.brandLabel ? `${entry.brandLabel} · ` : ""}
                  {entry.dosage} · {entry.frequency}
                  {entry.status === "discontinued" ? ` · stopped ${formatDate((entry.discontinuedAt ?? "").slice(0, 10))}` : ` · since ${formatDate(entry.startedAt.slice(0, 10))}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={entry.status === "active" ? "success" : "default"}>
                  {entry.status === "active" ? "Active" : "Discontinued"}
                </Badge>
                {entry.status === "active" && can("EDIT_ENCOUNTER") && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={running === entry.id}
                    onClick={() => setTarget(entry.id)}
                  >
                    Discontinue
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={!!target}
        onClose={() => setTarget(null)}
        title="Discontinue medication?"
      >
        <p className="text-sm text-ink-700">
          Record that this medication was discontinued. This updates the patient&apos;s active
          medication list.
        </p>
        <label className="mt-3 block">
          <span className="mb-1 block text-sm font-medium text-ink-900">Reason</span>
          <input
            className="h-11 w-full rounded-btn border border-ink-300 bg-surface px-3 text-sm text-ink-900 focus:outline-2 focus:outline-brand-600"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Adverse reaction, replaced by alternative"
          />
        </label>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" disabled={running === target} onClick={confirmDiscontinue}>
            {running === target ? "Updating..." : "Discontinue"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}