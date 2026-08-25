"use client";

import { use, useEffect, useRef, useState } from "react";
import { useAsync } from "@/lib/use-async";
import { useRealtime } from "@/features/realtime/hooks/useRealtime";
import { queueMockApi } from "@/features/queue/api/queue.mock";
import { useAnnouncement } from "@/features/queue/hooks/useAnnouncement";
import { AudioAnnouncementPanel } from "@/features/queue/components/AudioAnnouncementPanel";
import { ConnectionStatus } from "@/features/queue/components/ConnectionStatus";
import { QueueStatusBanner } from "@/features/queue/components/QueueStatusBanner";
import { queueOperationalState } from "@/features/queue/utils/queue-status";
import type { DisplaySnapshot } from "@/features/queue/types/queue.types";

function DisplayContent({ opdId }: { opdId: string }) {
  const { data, isLoading, error, reload } = useAsync(
    () => queueMockApi.getDisplaySnapshot(opdId),
    [opdId]
  );
  const { status: connection, subscribe } = useRealtime();
  const { announce } = useAnnouncement();
  const reloadRef = useRef(reload);
  const announceRef = useRef(announce);
  const dataRef = useRef<DisplaySnapshot | null>(null);
  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);
  useEffect(() => {
    announceRef.current = announce;
  }, [announce]);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  const [announcedToken, setAnnouncedToken] = useState<string | null>(null);

  useEffect(() => {
    return subscribe("*", (event) => {
      if (event.type === "CONNECTION_CHANGED" || ("opdId" in event && event.opdId === opdId)) {
        reloadRef.current();
      }
      if (event.type === "TOKEN_CALLED" && "opdId" in event && event.opdId === opdId && event.tokenNumber) {
        const snapshot = dataRef.current;
        if (snapshot?.nowServing !== event.tokenNumber) {
          announceRef.current(
            `Token ${event.tokenNumber}, please proceed to ${snapshot?.departmentName ?? ""} ${snapshot?.room ?? ""}.`
          );
          setAnnouncedToken(event.tokenNumber);
        }
      }
    });
  }, [subscribe, opdId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-brand-900 text-white">
        <p className="text-lg">Loading queue…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-brand-900 p-6 text-center text-white">
        <p className="text-xl">Unable to load display</p>
        <p className="text-sm text-brand-200">{error ?? "No data for this OPD."}</p>
        <button
          type="button"
          onClick={reload}
          className="rounded-btn bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20"
        >
          Retry
        </button>
      </div>
    );
  }

  const isAnnouncing = announcedToken === data.nowServing;
  const opState = queueOperationalState(data.opdStatus, data.waitingCount);

  return (
    <div className="flex min-h-screen flex-col bg-brand-900 text-white">
      <header className="border-b border-white/10 px-6 py-5 text-center">
        <p className="text-lg font-semibold uppercase tracking-[0.3em]">{data.hospitalName}</p>
        <p className="mt-1 text-sm text-brand-200">
          {data.departmentName} &middot; {data.opdName}
        </p>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-300">
          Now Serving
        </p>
        <p
          aria-label={`Now serving ${data.nowServing ?? "no token"}`}
          className={`text-[clamp(6rem,20vw,14rem)] font-bold leading-none tracking-tight ${
            isAnnouncing ? "animate-pulse text-brand-300" : ""
          }`}
        >
          {data.nowServing ?? "—"}
        </p>
        {data.room && (
          <p className="text-2xl font-medium tracking-widest text-brand-200">{data.room}</p>
        )}
        {data.doctorName && (
          <p className="text-sm text-brand-200">{data.doctorName}</p>
        )}

        {data.nextTokens.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-xs uppercase tracking-widest text-brand-300">Up next</p>
            <ol className="mt-3 flex flex-wrap items-center justify-center gap-3">
              {data.nextTokens.map((tokenNumber) => (
                <li
                  key={tokenNumber}
                  className="rounded-token border border-white/20 bg-white/5 px-4 py-2 text-lg font-semibold tabular-nums"
                >
                  {tokenNumber}
                </li>
              ))}
            </ol>
            {data.waitingCount > data.nextTokens.length && (
              <p className="mt-3 text-xs text-brand-300">
                +{data.waitingCount - data.nextTokens.length} more waiting
              </p>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-col gap-3">
          {opState !== "normal" && (
            <div className="flex justify-center">
              <QueueStatusBanner
                state={opState}
                opdName={data.opdName}
                reason={data.statusReason}
                updatedAt={data.statusUpdatedAt}
              />
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium tracking-[0.2em] text-brand-200">
              Please wait for your token
            </p>
            <ConnectionStatus status={connection} className="border-white/20 bg-white/5 text-white" />
          </div>
          <AudioAnnouncementPanel />
        </div>
      </footer>
    </div>
  );
}

export default function DisplayPage({
  params,
}: {
  params: Promise<{ opdId: string }>;
}) {
  const { opdId } = use(params);
  return <DisplayContent opdId={opdId} />;
}