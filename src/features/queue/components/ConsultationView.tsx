import type { QueueSnapshot } from "../types/queue.types";
import { ConnectionStatus } from "./ConnectionStatus";

type ConsultationViewProps = {
  snapshot: QueueSnapshot;
  connection: "connecting" | "connected" | "reconnecting" | "disconnected";
};

export function ConsultationView({ snapshot, connection }: ConsultationViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-ink-900">Your OPD Queue</h1>
        <ConnectionStatus status={connection} />
      </div>

      <div className="rounded-card bg-brand-700 p-6 text-center text-white shadow-token">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-100">
          Consultation in progress
        </p>
        <p className="mt-3 text-6xl font-bold tracking-tight">{snapshot.tokenNumber}</p>
        <p className="mt-1 text-sm text-brand-100">{snapshot.opdName}</p>
      </div>

      <dl className="divide-y divide-ink-100 rounded-card border border-ink-200 bg-surface shadow-card">
        <div className="flex justify-between px-4 py-3 text-sm">
          <dt className="text-ink-500">Room</dt>
          <dd className="font-medium text-ink-900">
            {snapshot.departmentName ?? snapshot.opdName}
            {snapshot.room ? ` — ${snapshot.room}` : ""}
          </dd>
        </div>
        <div className="flex justify-between px-4 py-3 text-sm">
          <dt className="text-ink-500">Doctor</dt>
          <dd className="font-medium text-ink-900">{snapshot.doctorName ?? "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
