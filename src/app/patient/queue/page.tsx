"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useQueueRealtime } from "@/features/queue/hooks/useQueueRealtime";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { useAssistanceActions } from "@/features/priority/hooks/usePriority";
import { AssistanceRequestDialog } from "@/features/priority/components/AssistanceRequestDialog";
import { PermissionGuard } from "@/features/auth/components/PermissionGuard";
import { WaitingView } from "@/features/queue/components/WaitingView";
import { NearTurnView } from "@/features/queue/components/NearTurnView";
import { CalledView } from "@/features/queue/components/CalledView";
import { ConsultationView } from "@/features/queue/components/ConsultationView";
import { CompletedView } from "@/features/queue/components/CompletedView";
import { TokenEndedView } from "@/features/queue/components/TokenEndedView";
import { QueueStatusBanner } from "@/features/queue/components/QueueStatusBanner";
import { queueOperationalState } from "@/features/queue/utils/queue-status";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import type { QueueSnapshot, PatientQueuePhase } from "@/features/queue/types/queue.types";
import type { ConnectionStatus } from "@/features/realtime/types/realtime.types";

function QueueContent() {
  const searchParams = useSearchParams();
  const opdId = searchParams.get("opd") ?? "opd_001";
  const tokenId = searchParams.get("token") ?? "tok_001";

  const { user } = useAuth();
  const patientId = user?.id ?? "";
  const patientName = user?.name ?? "Patient";

  const { data: snapshot, isLoading, error, reload, connection, phase } =
    useQueueRealtime(opdId, tokenId);

  const activeToken = snapshot
    ? { tokenId, tokenNumber: snapshot.tokenNumber, opdId }
    : null;
  const assistance = useAssistanceActions();

  const [reorderNotice, setReorderNotice] = useState(false);
  const prevAheadRef = useRef<number | null>(null);

  const prevPhase = useRef<PatientQueuePhase | null>(null);
  useEffect(() => {
    if (!phase) return;
    if (prevPhase.current === "waiting" && phase === "near_turn" && snapshot) {
      // Server sends QUEUE_TOKEN_APPROACHING via callNextEntry (§8) —
      // client notify removed to avoid duplicate.
    }
    prevPhase.current = phase;
  }, [phase, snapshot]);

  useEffect(() => {
    if (!snapshot || (phase !== "waiting" && phase !== "near_turn")) return;
    const previous = prevAheadRef.current;
    prevAheadRef.current = snapshot.patientsAhead;
    if (previous !== null && snapshot.patientsAhead > previous) {
      setReorderNotice(true);
      const timeout = setTimeout(() => setReorderNotice(false), 6000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [snapshot, phase]);

  const [assistOpen, setAssistOpen] = useState(false);
  const [assistConfirmed, setAssistConfirmed] = useState(false);

  async function handleAssistanceRequest(type: "mobility" | "communication" | "navigation" | "other") {
    const result = await assistance.request({
      patientId,
      patientName,
      type,
    });
    if (result) setAssistConfirmed(true);
  }

  const offline = connection === "reconnecting" || connection === "disconnected";
  const canAssist =
    phase === "waiting" || phase === "near_turn" || phase === "called" || phase === "in_consultation";
  const opState = snapshot ? queueOperationalState(snapshot.opdStatus, 0) : "normal";

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/patient/dashboard"
        className="text-sm text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
      >
        &larr; Dashboard
      </Link>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !snapshot ? (
        <p className="text-sm text-ink-500">Queue information unavailable.</p>
      ) : (
        <>
          {offline && (
            <div
              role="alert"
              className="rounded-card border border-status-warning-soft bg-status-warning-soft p-4 text-sm text-status-warning"
            >
              <p className="font-medium">Connection lost</p>
              <p className="mt-0.5 text-status-warning/90">
                Queue information may not be current. Last updated:{" "}
                {new Date(snapshot.fetchedAt).toLocaleTimeString("en-IN", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
                . Reconnecting…
              </p>
            </div>
          )}

          {reorderNotice && (
            <div
              role="status"
              className="rounded-card border border-status-info-soft bg-status-info-soft p-4 text-sm text-status-info"
            >
              <p className="font-medium">Queue updated</p>
              <p className="mt-0.5">
                The estimated waiting time changed because the hospital handled a priority case.
              </p>
            </div>
          )}

          {opState !== "normal" && (
            <QueueStatusBanner
              state={opState}
              opdName={snapshot.opdName}
              reason={snapshot.statusReason}
              updatedAt={snapshot.statusUpdatedAt}
            />
          )}

          <PhaseView snapshot={snapshot} connection={connection} phase={phase} />

          {canAssist && (
            <PermissionGuard permission="REQUEST_ASSISTANCE">
              <div className="rounded-card border border-ink-200 bg-surface p-4 text-center shadow-card">
                <p className="text-sm text-ink-700">
                  Need assistance getting through the hospital?
                </p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    setAssistConfirmed(false);
                    setAssistOpen(true);
                  }}
                >
                  Request Assistance
                </Button>
              </div>
            </PermissionGuard>
          )}
        </>
      )}

      <AssistanceRequestDialog
        key={String(assistOpen)}
        open={assistOpen}
        busy={assistance.isRunning}
        confirmed={assistConfirmed}
        onClose={() => setAssistOpen(false)}
        onConfirm={handleAssistanceRequest}
      />
    </div>
  );
}

type PhaseViewProps = {
  snapshot: QueueSnapshot;
  connection: ConnectionStatus;
  phase: PatientQueuePhase | null;
};

function PhaseView({ snapshot, connection, phase }: PhaseViewProps) {
  switch (phase) {
    case "near_turn":
      return <NearTurnView snapshot={snapshot} connection={connection} />;
    case "called":
      return <CalledView snapshot={snapshot} connection={connection} />;
    case "in_consultation":
      return <ConsultationView snapshot={snapshot} connection={connection} />;
    case "completed":
      return <CompletedView snapshot={snapshot} connection={connection} />;
    case "skipped":
    case "cancelled":
    case "no_show":
    case "expired":
      return <TokenEndedView snapshot={snapshot} connection={connection} />;
    case "waiting":
    default:
      return <WaitingView snapshot={snapshot} connection={connection} />;
  }
}

export default function QueuePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      }
    >
      <QueueContent />
    </Suspense>
  );
}
