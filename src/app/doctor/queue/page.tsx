"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { doctorMockApi } from "@/features/doctor/api/doctor.mock";
import { CallNextButton } from "@/features/queue/components/CallNextButton";
import { CurrentToken } from "@/features/queue/components/CurrentToken";
import { QueueList } from "@/features/queue/components/QueueList";
import {
  useCallNext,
  useDoctorQueue,
  useQueueAction,
} from "@/features/queue/hooks/useQueue";

const OPD_ID = "opd_001";

export default function DoctorQueuePage() {
  const router = useRouter();
  const { data, isLoading, error, reload } = useDoctorQueue(OPD_ID);
  const { callNext, isRunning: isCalling, error: callError } = useCallNext();
  const { run, isRunning: isActionBusy, error: actionError } = useQueueAction();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const [skipToken, setSkipToken] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  const busy = isCalling || isActionBusy;

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

  const handleOpenConsultation = useCallback(async () => {
    if (!data?.current) return;
    setOpening(true);
    const encounter = await doctorMockApi.getOrCreateEncounter(data.current.tokenNumber);
    setOpening(false);
    if (encounter) {
      router.push(`/doctor/consultation/${encounter.id}`);
    }
  }, [data, router]);

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
      <div>
        <h1 className="text-2xl font-bold text-ink-900">OPD Queue</h1>
        <p className="mt-1 text-sm text-ink-500">{data.opdName}</p>
      </div>

      {mutationError && (
        <p role="alert" className="rounded-card border border-status-danger-soft bg-status-danger-soft p-4 text-sm text-status-danger">
          {mutationError}
        </p>
      )}

      {data.current ? (
        <CurrentToken
          entry={data.current}
          isBusy={busy || opening}
          onStart={data.current.status === "called" ? handleStartConsultation : undefined}
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
        <p className="mt-0.5 text-sm text-ink-500">{data.counts.waiting} waiting</p>
        <div className="mt-4">
          <QueueList
            entries={data.waiting}
            busy={busy}
            onCall={handleCallToken}
            onSkip={handleSkip}
          />
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
