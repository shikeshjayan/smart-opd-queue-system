"use client";

import { useState } from "react";
import type { QueueSnapshot } from "../types/queue.types";
import { Button } from "@/components/ui/button";
import { ConnectionStatus } from "./ConnectionStatus";

type CalledViewProps = {
  snapshot: QueueSnapshot;
  connection: "connecting" | "connected" | "reconnecting" | "disconnected";
};

export function CalledView({ snapshot, connection }: CalledViewProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  if (acknowledged) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-ink-900">Token Called</h1>
          <ConnectionStatus status={connection} />
        </div>
        <div className="rounded-card border border-status-success-soft bg-status-success-soft p-6 text-center shadow-card">
          <p className="text-lg font-semibold text-status-success">Arrival confirmed</p>
          <p className="mt-1 text-sm text-status-success/90">
            Please proceed to {snapshot.departmentName ?? snapshot.opdName}
            {snapshot.room ? ` — ${snapshot.room}` : ""}
            {snapshot.doctorName ? ` · ${snapshot.doctorName}` : ""}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-ink-900">Your OPD Queue</h1>
        <ConnectionStatus status={connection} />
      </div>

      <div
        role="alert"
        className="rounded-card border-4 border-status-danger bg-status-danger p-6 text-center text-white shadow-card"
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-status-danger-soft">
          Your token is called
        </p>
        <p className="mt-3 text-7xl font-bold tracking-tight">{snapshot.tokenNumber}</p>
        <p className="mt-3 text-lg font-medium">
          Please proceed to {snapshot.departmentName ?? snapshot.opdName}
          {snapshot.room ? ` — ${snapshot.room}` : ""}
        </p>
        {snapshot.doctorName && <p className="mt-1 text-sm text-status-danger-soft">{snapshot.doctorName}</p>}
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={() => setAcknowledged(true)}
      >
        I&apos;ve Arrived
      </Button>
    </div>
  );
}
