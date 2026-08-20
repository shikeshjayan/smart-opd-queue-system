"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { doctorMockApi } from "@/features/doctor/api/doctor.mock";
import { CallNextButton } from "@/features/queue/components/CallNextButton";
import { ConnectionStatus } from "@/features/queue/components/ConnectionStatus";
import { CurrentToken } from "@/features/queue/components/CurrentToken";
import { QueueList } from "@/features/queue/components/QueueList";
import { QueueStatusBanner } from "@/features/queue/components/QueueStatusBanner";
import { queueOperationalState } from "@/features/queue/utils/queue-status";
import { PriorityBadge } from "@/features/priority/components/PriorityBadge";
import type { QueueEntry, QueuePriority } from "@/types";
import {
  useCallNext,
  useQueueAction,
} from "@/features/queue/hooks/useQueue";
import { useDoctorQueueRealtime } from "@/features/queue/hooks/useQueueRealtime";
import { QUEUE_OPD_ID } from "@/features/queue/config";
import {
  isAutoAdvancing,
  onAutoAdvanceChange,
  startAutoAdvance,
  stopAutoAdvance,
} from "@/features/realtime/simulator";
import { useRealtime } from "@/features/realtime/hooks/useRealtime";

const OPD_ID = QUEUE_OPD_ID;

export default function DoctorQueuePage() {
  const router = useRouter();
  const { data, isLoading, error, reload, connection } = useDoctorQueueRealtime(OPD_ID);
  const { callNext, isRunning: isCalling, error: callError } = useCallNext();
  const { run, isRunning: isActionBusy, error: actionError } = useQueueAction();
  const { simulateDisconnect } = useRealtime();
  const [autoAdvancing, setAutoAdvancing] = useState(isAutoAdvancing());

  useEffect(() => onAutoAdvanceChange(() => setAutoAdvancing(isAutoAdvancing())), []);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const [skipToken, setSkipToken] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  const busy = isCalling || isActionBusy;

  const waitingByPriority = useMemo(() => {
    const groups: Record<QueuePriority, QueueEntry[]> = {
      emergency: [],
      priority: [],
      normal: [],
    };
    for (const entry of data?.waiting ?? []) groups[entry.priority].push(entry);
    return groups;
  }, [data?.waiting]);

  const priorityWaiting = data
    ? data.priorityCounts.emergency + data.priorityCounts.priority
    : 0;

  const handleCallConfirmed = useCallback(async () => {
    const entry = await callNext(OPD_ID);
    setConfirmOpen(false);
    if (entry) reload();
  }, [callNext, reload]);

  const handleSkip = useCallback(
    async (tokenNumber: string) => {
      setSkipToken(tokenNumber);
      setSkipOpen(true);
    },
    []
  );

  const handleCallToken = useCallback(
    async (tokenNumber: string) => {
      const entry = await run("call", tokenNumber);
      if (entry) reload();
    },
    [run, reload]
  );

  const handleSkipConfirmed = useCallback(async () => {
    if (!skipToken) return;
    const entry = await run("skip", skipToken);
    setSkipOpen(false);
    setSkipToken(null);
    if (entry) reload();
  }, [run, skipToken, reload]);

  const handleStartConsultation = useCallback(async () => {
    if (!data?.current) return;
    const entry = await run("start", data.current.tokenNumber);
    if (entry) reload();
  }, [run, data, reload]);

  const handleComplete = useCallback(async () => {
    if (!data?.current) return;
    const entry = await run("complete", data.current.tokenNumber);
    if (entry) reload();
  }, [run, data, reload]);

  const handleOpenConsultation = useCallback(async () => {
    if (!data?.current) return;
    setOpening(true);
    const encounter = await doctorMockApi.getOrCreateEncounter(data.current.tokenNumber);
    setOpening(false);
    if (encounter && encounter.patientId) {
      router.push(`/doctor/patients/${encounter.patientId}/consultation`);
    }
  }, [data, router]);

  const handleToggleAutoAdvance = useCallback(() => {
    if (isAutoAdvancing()) {
      stopAutoAdvance();
    } else {
      void startAutoAdvance(OPD_ID, { intervalMs: 6000 });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Unable to load queue."} onRetry={reload} />;
  }

  const mutationError = callError ?? actionError;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">OPD Queue</h1>
          <p className="mt-1 text-sm text-ink-500">{data.opdName}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/display/${OPD_ID}`}
            target="_blank"
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            Open display
          </Link>
          <ConnectionStatus status={connection} />
        </div>
      </div>

      {mutationError && (
        <p role="alert" className="rounded-card border border-status-danger-soft bg-status-danger-soft p-4 text-sm text-status-danger">
          {mutationError}
        </p>
      )}

      {queueOperationalState(data.opdStatus, data.counts.waiting) !== "normal" && (
        <QueueStatusBanner
          state={queueOperationalState(data.opdStatus, data.counts.waiting)}
          opdName={data.opdName}
          reason={data.statusReason}
          updatedAt={data.statusUpdatedAt}
        />
      )}

      {process.env.NODE_ENV === "development" && (
        <div className="flex flex-wrap items-center gap-2 rounded-card border border-ink-200 bg-surface p-3 text-xs text-ink-500 shadow-card">
          <span className="font-medium text-ink-700">Simulation</span>
          <button
            type="button"
            onClick={handleToggleAutoAdvance}
            className="rounded-btn border border-ink-300 px-2.5 py-1 font-medium text-ink-700 transition-colors hover:bg-ink-100"
          >
            {autoAdvancing ? "Stop auto-advance" : "Start auto-advance"}
          </button>
          <button
            type="button"
            onClick={simulateDisconnect}
            className="rounded-btn border border-ink-300 px-2.5 py-1 font-medium text-ink-700 transition-colors hover:bg-ink-100"
          >
            Simulate disconnect
          </button>
          {autoAdvancing && (
            <span className="text-status-warning">Queue advancing every few seconds…</span>
          )}
        </div>
      )}

      {data.current ? (
        <CurrentToken
          entry={data.current}
          isBusy={busy || opening}
          onStart={data.current.status === "called" ? handleStartConsultation : undefined}
          onComplete={data.current.status === "in_consultation" ? handleComplete : undefined}
          onOpenConsultation={handleOpenConsultation}
        />
      ) : (
        <section aria-labelledby="no-current-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
          <h2 id="no-current-title" className="text-lg font-semibold text-ink-900">
            Currently Consulting
          </h2>
          <p className="mt-2 text-sm text-ink-500">No patient is being consulted right now.</p>
        </section>
      )}

      <section aria-labelledby="queue-actions-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <h2 id="queue-actions-title" className="sr-only">
          Queue actions
        </h2>
        <CallNextButton
          hasWaiting={data.waiting.length > 0}
          isRunning={isCalling}
          onClick={() => setConfirmOpen(true)}
        />
        {data.next && (
          <p className="mt-3 text-center text-sm text-ink-500">
            Next in line: <span className="font-semibold tabular-nums text-ink-900">{data.next.tokenNumber}</span>
            {data.next.patientName ? ` · ${data.next.patientName}` : ""}
          </p>
        )}
      </section>

      <section aria-labelledby="waiting-list-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <h2 id="waiting-list-title" className="text-lg font-semibold text-ink-900">
          Waiting Patients
        </h2>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-ink-500">
          <span>{data.counts.waiting} waiting</span>
          <span className="text-ink-300">&middot;</span>
          <span>Emergency {data.priorityCounts.emergency}</span>
          <span className="text-ink-300">&middot;</span>
          <span>Priority {data.priorityCounts.priority}</span>
          <span className="text-ink-300">&middot;</span>
          <span>Normal {data.priorityCounts.normal}</span>
        </div>
        {priorityWaiting > 0 && (
          <p className="mt-2 rounded-card border border-status-danger-soft bg-status-danger-soft px-3 py-2 text-sm font-medium text-status-danger">
            {priorityWaiting} priority patient{priorityWaiting === 1 ? "" : "s"} waiting
          </p>
        )}
        <div className="mt-4 flex flex-col gap-6">
          {(["emergency", "priority", "normal"] as const).map((priority) => {
            const entries = waitingByPriority[priority];
            if (entries.length === 0) return null;
            return (
              <section key={priority} aria-label={`${priority} patients`}>
                <div className="mb-2 flex items-center gap-2">
                  <PriorityBadge priority={priority} />
                  <span className="text-xs text-ink-500">{entries.length}</span>
                </div>
                <QueueList
                  entries={entries}
                  busy={busy}
                  onCall={handleCallToken}
                  onSkip={handleSkip}
                />
              </section>
            );
          })}
        </div>
      </section>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Call next patient?"
      >
        <p className="text-sm text-ink-700">
          {data.next
            ? `Call ${data.next.tokenNumber}${data.next.patientName ? ` (${data.next.patientName})` : ""} now?`
            : "There are no patients waiting."}
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" disabled={busy} onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={busy || !data.next}
            onClick={handleCallConfirmed}
          >
            {isCalling ? "Calling..." : "Confirm"}
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={skipOpen}
        onClose={() => setSkipOpen(false)}
        title="Skip patient?"
      >
        <p className="text-sm text-ink-700">
          Skip token <span className="font-semibold">{skipToken}</span>? They will be moved to the end of the queue.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" disabled={busy} onClick={() => setSkipOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={busy}
            onClick={handleSkipConfirmed}
          >
            {isActionBusy ? "Skipping..." : "Skip"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
