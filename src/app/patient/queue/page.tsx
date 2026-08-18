"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { useQueueRealtime } from "@/features/queue/hooks/useQueueRealtime";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { WaitingView } from "@/features/queue/components/WaitingView";
import { NearTurnView } from "@/features/queue/components/NearTurnView";
import { CalledView } from "@/features/queue/components/CalledView";
import { ConsultationView } from "@/features/queue/components/ConsultationView";
import { CompletedView } from "@/features/queue/components/CompletedView";
import { TokenEndedView } from "@/features/queue/components/TokenEndedView";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import type { QueueSnapshot, PatientQueuePhase } from "@/features/queue/types/queue.types";
import type { ConnectionStatus } from "@/features/realtime/types/realtime.types";
import { DEMO_PATIENT_ID } from "@/config/app";
import { useAuth } from "@/features/auth/hooks/useAuth";

function QueueContent() {
  const searchParams = useSearchParams();
  const opdId = searchParams.get("opd") ?? "opd_001";
  const tokenId = searchParams.get("token") ?? "tok_001";

  const { user } = useAuth();
  const patientId = user?.id ?? DEMO_PATIENT_ID;

  const { data: snapshot, isLoading, error, reload, connection, phase } =
    useQueueRealtime(opdId, tokenId);

  const activeToken = snapshot
    ? { tokenId, tokenNumber: snapshot.tokenNumber, opdId }
    : null;
  const { notify } = useNotifications(patientId, activeToken);

  const prevPhase = useRef<PatientQueuePhase | null>(null);
  useEffect(() => {
    if (!phase) return;
    if (prevPhase.current === "waiting" && phase === "near_turn" && snapshot) {
      void notify(
        {
          type: "queue",
          priority: "important",
          title: "Your turn is approaching",
          message: `Token ${snapshot.tokenNumber}. You are ${snapshot.patientsAhead} patient${
            snapshot.patientsAhead === 1 ? "" : "s"
          } ahead. Please stay nearby.`,
          tokenNumber: snapshot.tokenNumber,
        },
        "token_approaching"
      );
    }
    prevPhase.current = phase;
  }, [phase, snapshot, notify]);

  const offline = connection === "reconnecting" || connection === "disconnected";

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
          <PhaseView snapshot={snapshot} connection={connection} phase={phase} />
        </>
      )}
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
